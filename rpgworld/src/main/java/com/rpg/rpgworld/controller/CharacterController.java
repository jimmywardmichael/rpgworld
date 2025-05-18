package com.rpg.rpgworld.controller;

import com.rpg.rpgworld.model.GameCharacter;
import com.rpg.rpgworld.service.CharacterService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/characters")
public class CharacterController {

    private final CharacterService service;

    public CharacterController(CharacterService service) {
        this.service = service;
    }

    @GetMapping
    public String listCharacters(Model model) {
        model.addAttribute("characters", service.getAllCharacters());
        return "characters";
    }

    @GetMapping("/new")
    public String showCreateForm(Model model) {
        model.addAttribute("character", new GameCharacter());
        return "character_form";
    }

    @PostMapping
    public String createCharacter(@ModelAttribute GameCharacter character) {
        service.saveCharacter(character);
        return "redirect:/characters";
    }
}
