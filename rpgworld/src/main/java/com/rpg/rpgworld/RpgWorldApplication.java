package com.rpg.rpgworld;

import io.micrometer.observation.annotation.Observed;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@Observed
@SpringBootApplication
public class RpgWorldApplication {

    public static void main(String[] args) {
        SpringApplication.run(RpgWorldApplication.class, args);
    }

}
