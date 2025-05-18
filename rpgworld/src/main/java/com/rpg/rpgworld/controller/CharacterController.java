package com.rpg.rpgworld.controller;

import com.rpg.rpgworld.model.GameCharacter;
import com.rpg.rpgworld.repository.CharacterRepository;
import com.rpg.rpgworld.service.CharacterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/characters")
public class CharacterController {

    private final CharacterService service;
    @Autowired
    private CharacterRepository characterRepository;
    public CharacterController(CharacterService service) {
        this.service = service;
    }

    @GetMapping("/characters")
    public String showCharacters(Model model) {
        model.addAttribute("characters", characterRepository.findAll());
        return "characters";
    }

//    @GetMapping("/character_form")
//    public String showCharacterForm(Model model) {
//        model.addAttribute("character", new GameCharacter());
//        return "character_form";
//    }

    @GetMapping
    public String listCharacters(Model model) {
        model.addAttribute("characters", service.getAllCharacters());
        return "characters";
    }

    @GetMapping("/character_form")
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
