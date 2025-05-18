package com.rpg.rpgworld.controller;


import com.rpg.rpgworld.repository.CharacterRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    private final CharacterRepository characterRepository;

    public HomeController(CharacterRepository characterRepository) {
        this.characterRepository = characterRepository;
    }

    @GetMapping("/")
    public String showCharacters(Model model) {
        model.addAttribute("characters", characterRepository.findAll());
        return "characters";
    }
}
