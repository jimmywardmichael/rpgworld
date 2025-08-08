package com.rpg.rpgworld.repository;

import com.rpg.rpgworld.model.GameCharacter;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CharacterRepository extends JpaRepository<GameCharacter, Long> {
    GameCharacter findTopByOrderByIdDesc();
}
