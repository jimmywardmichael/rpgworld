package com.rpg.rpgworld.service;

import com.rpg.rpgworld.model.GameCharacter;
import com.rpg.rpgworld.repository.CharacterRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CharacterService {

    private final CharacterRepository repo;

    public CharacterService(CharacterRepository repo) {
        this.repo = repo;
    }

    public List<GameCharacter> getAllCharacters() {
        return repo.findAll();
    }

    public Optional<GameCharacter> getCharacterById(Long id) {
        return repo.findById(id);
    }

    public GameCharacter saveCharacter(GameCharacter character) {
        return repo.save(character);
    }

    public void deleteCharacter(Long id) {
        repo.deleteById(id);
    }
}
