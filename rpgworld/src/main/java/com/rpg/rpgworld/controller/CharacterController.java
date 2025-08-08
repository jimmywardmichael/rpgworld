package com.rpg.rpgworld.controller;

import com.rpg.rpgworld.model.GameCharacter;
import com.rpg.rpgworld.repository.CharacterRepository;
import com.rpg.rpgworld.service.CharacterService;
import io.micrometer.observation.annotation.Observed;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
@Observed
@Controller
@RequestMapping("/characters")
public class CharacterController {

    private final CharacterService service;
    @Autowired
    private CharacterRepository characterRepository;
    public CharacterController(CharacterService service) {
        this.service = service;
    }

    // Latest character (as active) JSON for the 3D map to consume
    @GetMapping(value = "/latest.json")
    @ResponseBody
    public GameCharacter latestCharacterJson() {
        GameCharacter latest = characterRepository.findTopByOrderByIdDesc();
        return latest; // may be null; frontend should handle
    }

    // Fetch character by ID (for starting with a saved character)
    @GetMapping(value = "/{id}.json")
    @ResponseBody
    public GameCharacter characterById(@PathVariable Long id) {
        return characterRepository.findById(id).orElse(null);
    }

    @GetMapping("/characters")
    public String showCharacters(Model model) {
        model.addAttribute("characters", characterRepository.findAll());
        return "characters";
    }


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
        Long id = character.getId();
        return id != null ? "redirect:/play/map?charId=" + id : "redirect:/play/map";
    }
}
