package com.rpg.rpgworld.model;

import jakarta.persistence.*;

@Entity
@Table(name = "rpgworld")
public class GameCharacter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private int health;
    private int attack;
    private int defense;
    private int level;
    private String skills;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getHealth() { return health; }
    public void setHealth(int health) { this.health = health; }

    public int getAttack() { return attack; }
    public void setAttack(int attack) { this.attack = attack; }

    public int getDefense() { return defense; }
    public void setDefense(int defense) { this.defense = defense; }


    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public String getSkills() {
        return skills;
    }

    public void setSkills(String skills) {
        this.skills = skills;
    }
}

