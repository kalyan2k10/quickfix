package com.innovation.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.stream.Collectors;
import jakarta.annotation.PostConstruct;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VehicleEstimationService {

    private static final Logger logger = LoggerFactory.getLogger(VehicleEstimationService.class);
    private static final Map<String, String> vehicleAgeCache = new ConcurrentHashMap<>();
    private final WebClient webClient;
    private final String apiKey;
    private static final String GEMINI_TEXT_MODEL = "gemini-pro-latest";
    private static final String GEMINI_VISION_MODEL = "gemini-flash-latest";

    public VehicleEstimationService(WebClient.Builder webClientBuilder,
            @Value("${gemini.api.key}") String apiKey) {
        this.apiKey = apiKey;
        // Point to the Google Gemini API endpoint
        this.webClient = webClientBuilder
                .baseUrl("https://generativelanguage.googleapis.com")
                .build();
    }

    // --- DTOs for Gemini API ---
    private record GeminiRequest(List<Content> contents) {
    }

    private record Content(List<Part> parts) {
    }

    private record Part(String text, InlineData inline_data) {
    }

    private record InlineData(String mime_type, String data) {
    }

    private record GeminiResponse(List<Candidate> candidates) {
    }

    private record Candidate(Content content) {
    }

    // --- DTOs for Listing Models ---
    private record ModelListResponse(List<ModelInfo> models) {
    }

    private record ModelInfo(String name, String displayName) {
    }

    private record VehicleAnalysisResult(String vehicleType, String vehicleNumber, String generationYear,
            String makeModel, String damageDetection, String tireWear, String damagedParts) {
    }

    public record VehicleInfoResult(String vehicleType, String vehicleNumber, String estimatedAge, String makeModel,
            String damageDetection, String tireWear, String damagedParts) {
    }

    @PostConstruct
    public void listAvailableModels() {
        logger.info("Fetching available Gemini models on startup...");
        try {
            Mono<ModelListResponse> responseMono = this.webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1beta/models")
                            .queryParam("key", this.apiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(ModelListResponse.class);

            ModelListResponse response = responseMono.block(Duration.ofSeconds(20));
            logger.warn("Listing available Gemini models..");
            if (response != null && response.models() != null && !response.models().isEmpty()) {
                String availableModels = response.models().stream()
                        .map(model -> model.name().replace("models/", ""))
                        .collect(Collectors.joining(", "));
                logger.info("Successfully fetched available models: {}", availableModels);
            } else {
                logger.warn("Could not fetch or no available models found.");
            }
        } catch (Exception e) {
            logger.error(
                    "Failed to fetch available Gemini models. This may indicate an API key or permission issue. Error: {}",
                    e.getMessage());
        }
    }

    public VehicleInfoResult computeVehicleInfo(String vehicleNumber, MultipartFile imageFile) {
        String finalVehicleNumber = vehicleNumber;
        String vehicleType = "UNKNOWN";
        String estimatedAge = null;
        String makeModel = null;
        String damageDetection = null;
        String tireWear = null;
        String damagedParts = null;

        // 1. Analyze image if provided
        if (imageFile != null && !imageFile.isEmpty()) {
            VehicleAnalysisResult analysisResult = determineVehicleNature(imageFile);
            if (analysisResult != null) {
                if (analysisResult.vehicleType() != null) {
                    vehicleType = analysisResult.vehicleType();
                }
                // If user didn't provide a number, use the one from the image
                if ((finalVehicleNumber == null || finalVehicleNumber.isBlank())
                        && !"UNKNOWN".equalsIgnoreCase(analysisResult.vehicleNumber())) {
                    finalVehicleNumber = analysisResult.vehicleNumber();
                }
                if (analysisResult.generationYear() != null && !analysisResult.generationYear().isBlank()
                        && !"UNKNOWN".equalsIgnoreCase(analysisResult.generationYear())) {
                    estimatedAge = analysisResult.generationYear();
                }
                makeModel = analysisResult.makeModel();
                damageDetection = analysisResult.damageDetection();
                tireWear = analysisResult.tireWear();
                damagedParts = analysisResult.damagedParts();
            }
        }

        // 2. Estimate age if a vehicle number is available and we don't already have an
        // age
        if (estimatedAge == null && finalVehicleNumber != null && !finalVehicleNumber.isBlank()
                && !"UNKNOWN".equalsIgnoreCase(finalVehicleNumber)) {
            estimatedAge = estimateVehicleAge(finalVehicleNumber);
        }

        return new VehicleInfoResult(vehicleType, finalVehicleNumber, estimatedAge, makeModel, damageDetection,
                tireWear, damagedParts);
    }

    private String estimateVehicleAge(String vehicleNumber) {
        // Check cache first
        if (vehicleAgeCache.containsKey(vehicleNumber)) {
            logger.info("Returning cached age for vehicle number: {}", vehicleNumber);
            return vehicleAgeCache.get(vehicleNumber);
        }

        // If not in cache, call the API
        logger.info("Calling Gemini to estimate age for vehicle number: {}", vehicleNumber);

        String prompt = String.format(
                "Based on the Indian vehicle registration number '%s', what is the estimated age of the vehicle? " +
                        "Please provide only a concise string like '5 year(s) old' or 'less than a year old'. " +
                        "If the age cannot be determined from the number, just return 'unknown'.",
                vehicleNumber);

        GeminiRequest request = new GeminiRequest(List.of(new Content(List.of(new Part(prompt, null)))));

        try {
            Mono<GeminiResponse> responseMono = this.webClient.post() // Use the base webClient
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1beta/models/{model}:generateContent")
                            .queryParam("key", this.apiKey)
                            .build(GEMINI_TEXT_MODEL))
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(GeminiResponse.class);

            // We block here to get the result synchronously.
            GeminiResponse response = responseMono.block(Duration.ofSeconds(20));

            if (response != null && response.candidates() != null && !response.candidates().isEmpty()) {
                String estimatedAge = response.candidates().get(0).content().parts().get(0).text().trim();
                logger.info("Successfully received age estimation from Gemini for {}: {}", vehicleNumber, estimatedAge);
                // Store the result in the cache before returning
                vehicleAgeCache.put(vehicleNumber, estimatedAge);
                return estimatedAge;
            } else {
                logger.warn("Received an empty or invalid response from Gemini for vehicle: {}", vehicleNumber);
                return null;
            }
        } catch (Exception e) {
            logger.error("Failed to call Gemini API for vehicle number: {}. Error: {}",
                    vehicleNumber, e.getMessage());
            return null; // Return null on any error (e.g., timeout, network issue, 4xx/5xx)
        }
    }

    private VehicleAnalysisResult determineVehicleNature(MultipartFile imageFile) {
        if (imageFile == null || imageFile.isEmpty()) {
            return null;
        }

        try {
            String base64Image = java.util.Base64.getEncoder().encodeToString(imageFile.getBytes());
            String mimeType = imageFile.getContentType();

            String promptText = "Analyze this image with the following objectives. Respond with each item on a new line in 'Key: Value' format.\n"
                    + "1. **Type**: Identify if it is a 'TWO_WHEELER' or 'FOUR_WHEELER'.\n"
                    + "2. **Number**: Extract the vehicle license plate number. Use 'UNKNOWN' if not visible.\n"
                    + "3. **Make & Model**: Identify the make and model (e.g., 'Maruti Suzuki Swift').\n"
                    + "4. **Generation/Year**: Estimate the production year or generation based on design cues.\n"
                    + "5. **Damage Detection**: List any visible damage like dents, scratches, or broken parts.\n"
                    + "6. **Tire Wear**: Briefly assess tire condition if visible.\n"
                    + "7. **Damaged Parts**: Identify specific damaged parts (e.g., 'Left Front Fender').";

            Part textPart = new Part(promptText, null);
            Part imagePart = new Part(null, new InlineData(mimeType, base64Image));

            GeminiRequest request = new GeminiRequest(List.of(new Content(List.of(textPart, imagePart))));

            Mono<GeminiResponse> responseMono = this.webClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1beta/models/{model}:generateContent")
                            .queryParam("key", this.apiKey)
                            .build(GEMINI_VISION_MODEL))
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(GeminiResponse.class);

            GeminiResponse response = responseMono.block();

            String responseText = response.candidates().get(0).content().parts().get(0).text().trim();

            // Log the full raw response for debugging and analysis
            logger.info("Full Gemini Vehicle Nature Analysis:\n---\n{}\n---", responseText);

            String vehicleType = "UNKNOWN";
            String vehicleNumber = "UNKNOWN";
            String generationYear = null;
            String makeModel = null;
            String damageDetection = null;
            String tireWear = null;
            String damagedParts = null;

            // Basic parsing to extract core information needed by the application for now
            String[] parts = responseText.split("\\n");
            for (String part : parts) {
                String trimmed = part.trim();
                // Handle potential markdown (e.g., "**Type**:")
                String cleanPart = trimmed.replaceAll("\\*\\*", "");

                if (cleanPart.startsWith("Type:")) {
                    vehicleType = cleanPart.substring(5).trim();
                } else if (cleanPart.startsWith("Number:")) {
                    vehicleNumber = cleanPart.substring(7).trim();
                } else if (cleanPart.startsWith("Generation/Year:")) {
                    generationYear = cleanPart.substring(16).trim();
                } else if (cleanPart.startsWith("Make & Model:")) {
                    makeModel = cleanPart.substring(13).trim();
                } else if (cleanPart.startsWith("Damage Detection:")) {
                    damageDetection = cleanPart.substring(17).trim();
                } else if (cleanPart.startsWith("Tire Wear:")) {
                    tireWear = cleanPart.substring(10).trim();
                } else if (cleanPart.startsWith("Damaged Parts:")) {
                    damagedParts = cleanPart.substring(14).trim();
                }
            }

            // Fallback if parsing failed but keywords are present
            if ("UNKNOWN".equals(vehicleType) && responseText.contains("TWO_WHEELER"))
                vehicleType = "TWO_WHEELER";
            if ("UNKNOWN".equals(vehicleType) && responseText.contains("FOUR_WHEELER"))
                vehicleType = "FOUR_WHEELER";

            return new VehicleAnalysisResult(vehicleType, vehicleNumber, generationYear, makeModel, damageDetection,
                    tireWear, damagedParts);
        } catch (Exception e) {
            logger.error("Failed to call Gemini Vision API for vehicle nature analysis.", e);
            return null;
        }
    }
}