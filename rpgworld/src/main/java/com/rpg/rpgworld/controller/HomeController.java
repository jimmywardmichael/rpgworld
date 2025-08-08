package com.rpg.rpgworld.controller;

import com.rpg.rpgworld.repository.CharacterRepository;
import io.micrometer.observation.annotation.Observed;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
@Observed
@Controller
public class HomeController {

    private final CharacterRepository characterRepository;

    public HomeController(CharacterRepository characterRepository) {
        this.characterRepository = characterRepository;
    }

    // Show the main menu (home.html)
    @GetMapping("/")
    public String home() {
        return "home";
    }

    // 3D pages
    @GetMapping("/play/map")
    public String playMap() {
        return "map3d";
    }

    @GetMapping("/play/cave")
    public String playCave() {
        return "cave3d";
    }

    @GetMapping("/play/store")
    public String playStore() {
        return "store3d";
    }

    // Delete character by ID
    @PostMapping("/deleteCharacter/{id}")
    public String deleteCharacter(@PathVariable Long id) {
        characterRepository.deleteById(id);
        return "redirect:/characters"; // redirecting instead of just /characters so it shows updated list after deletion
    }
}
