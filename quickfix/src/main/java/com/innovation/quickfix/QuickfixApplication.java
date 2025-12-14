package com.innovation.quickfix;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {
		"com.innovation.quickfix", // For this main application class
		"com.innovation.controller",
		"com.innovation.service",
		"com.innovation.config", // Assuming you might have a config package
		"com.innovation.repository"
})
@EntityScan(basePackages = { "com.innovation.model" })
@EnableJpaRepositories(basePackages = { "com.innovation.repository" })
public class QuickfixApplication {

	public static void main(String[] args) {
		SpringApplication.run(QuickfixApplication.class, args);
	}

}
