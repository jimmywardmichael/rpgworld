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
    private int magic;   // magic power
    private int mana;    // resource pool
    private int level = 1;
    private int xp;      // experience points
    private String skills;

    // Inventory/Stats
    private int gold;
    private int armor; // simple armor rating
    private String weapon; // weapon name

    // Appearance customization
    private String skinColor;   // hex like #ffcc99
    private String shirtColor;  // hex
    private String pantsColor;  // hex
    private String faceType;    // e.g., neutral, smile, angry
    private String charClass;   // e.g., Wizard, Barbarian, Archer

    // Simple inventory stored as CSV (e.g., "Sword,Axe,Potion")
    @Column(length = 2000)
    private String inventory;

    // Magic: learned spells CSV and currently equipped spell
    @Column(length = 1000)
    private String spells;           // e.g., "Fireball,Heal"
    private String equippedSpell;    // e.g., "Fireball"

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

    public int getMagic() { return magic; }
    public void setMagic(int magic) { this.magic = magic; }

    public int getMana() { return mana; }
    public void setMana(int mana) { this.mana = mana; }

    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }

    public int getXp() { return xp; }
    public void setXp(int xp) { this.xp = xp; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public int getGold() { return gold; }
    public void setGold(int gold) { this.gold = gold; }

    public int getArmor() { return armor; }
    public void setArmor(int armor) { this.armor = armor; }

    public String getWeapon() { return weapon; }
    public void setWeapon(String weapon) { this.weapon = weapon; }

    public String getSkinColor() { return skinColor; }
    public void setSkinColor(String skinColor) { this.skinColor = skinColor; }

    public String getShirtColor() { return shirtColor; }
    public void setShirtColor(String shirtColor) { this.shirtColor = shirtColor; }

    public String getPantsColor() { return pantsColor; }
    public void setPantsColor(String pantsColor) { this.pantsColor = pantsColor; }

    public String getFaceType() { return faceType; }
    public void setFaceType(String faceType) { this.faceType = faceType; }

    public String getCharClass() { return charClass; }
    public void setCharClass(String charClass) { this.charClass = charClass; }

    public String getInventory() { return inventory; }
    public void setInventory(String inventory) { this.inventory = inventory; }

    public String getSpells() { return spells; }
    public void setSpells(String spells) { this.spells = spells; }

    public String getEquippedSpell() { return equippedSpell; }
    public void setEquippedSpell(String equippedSpell) { this.equippedSpell = equippedSpell; }
}

