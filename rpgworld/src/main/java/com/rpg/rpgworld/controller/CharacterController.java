package com.rpg.rpgworld.controller;


import com.rpg.rpgworld.repository.CharacterRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import com.rpg.rpgworld.model.Character;

import java.util.List;

@Controller
@RequestMapping("/characters")
public class CharacterController {

    private final CharacterRepository repo;

    public CharacterController(CharacterRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public String listCharacters(Model model) {
        List<Character> characters = repo.findAll();
        model.addAttribute("characters", characters);
        return "characters";
    }

    @GetMapping("/new")
    public String showCreateForm(Model model) {
        model.addAttribute("character", new Character());
        return "character_form";
    }

    @PostMapping
    public String createCharacter(@ModelAttribute Character character) {
        repo.save(character);
        return "redirect:/characters";
    }

    @GetMapping("/delete/{id}")
    public String deleteCharacter(@PathVariable Long id) {
        repo.deleteById(id);
        return "redirect:/characters";
    }
}
