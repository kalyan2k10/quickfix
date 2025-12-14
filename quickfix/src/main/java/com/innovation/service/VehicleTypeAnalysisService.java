package com.innovation.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.Base64;
import java.util.List;

@Service
public class VehicleTypeAnalysisService {

    private static final Logger logger = LoggerFactory.getLogger(VehicleTypeAnalysisService.class);
    private final WebClient webClient;
    private final String apiKey;
    private static final String GEMINI_MODEL = "gemini-flash-latest"; // Use a model confirmed to be available

    public VehicleTypeAnalysisService(WebClient.Builder webClientBuilder, @Value("${gemini.api.key}") String apiKey) {
        this.apiKey = apiKey;
        this.webClient = webClientBuilder.baseUrl("https://generativelanguage.googleapis.com").build();
    }

    // --- DTOs for Gemini Vision API ---
    private record GeminiVisionRequest(List<Content> contents) {
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

    private record TextPart(String text) {
    }

    private record VisionContent(List<TextPart> parts) {
    }

    public String determineVehicleType(MultipartFile imageFile) {
        if (imageFile == null || imageFile.isEmpty()) {
            return null;
        }

        try {
            String base64Image = Base64.getEncoder().encodeToString(imageFile.getBytes());
            String mimeType = imageFile.getContentType();

            String promptText = "Is this image of a two-wheeler or a four-wheeler? Please respond with only 'TWO_WHEELER' or 'FOUR_WHEELER'.";

            Part textPart = new Part(promptText, null);
            Part imagePart = new Part(null, new InlineData(mimeType, base64Image));

            GeminiVisionRequest request = new GeminiVisionRequest(List.of(new Content(List.of(textPart, imagePart))));

            Mono<GeminiResponse> responseMono = this.webClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1beta/models/{model}:generateContent")
                            .queryParam("key", this.apiKey)
                            .build(GEMINI_MODEL))
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(GeminiResponse.class);

            GeminiResponse response = responseMono.block();

            String vehicleType = response.candidates().get(0).content().parts().get(0).text().trim();
            logger.info("Gemini determined vehicle type: {}", vehicleType);
            return vehicleType;
        } catch (IOException e) {
            logger.error("Failed to read image file for vehicle type analysis.", e);
            return null;
        } catch (Exception e) {
            logger.error("Failed to call Gemini Vision API for vehicle type analysis.", e);
            return null;
        }
    }
}