package com.rpg.rpgworld.controller;

import com.rpg.rpgworld.repository.CharacterRepository;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

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

    // Delete character by ID
    @PostMapping("/deleteCharacter/{id}")
    public String deleteCharacter(@PathVariable Long id) {
        characterRepository.deleteById(id);
        return "redirect:/characters"; // return to character list after deletion
    }
}
