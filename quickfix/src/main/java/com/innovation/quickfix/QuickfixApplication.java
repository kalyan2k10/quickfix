package com.innovation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication
@EntityScan(basePackages = { "com.innovation.model" })
public class QuickfixApplication {

	public static void main(String[] args) {
		SpringApplication.run(QuickfixApplication.class, args);
	}

}
