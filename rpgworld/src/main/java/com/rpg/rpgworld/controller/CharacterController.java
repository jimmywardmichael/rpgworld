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

    // Latest character (as active) JSON for the 3D map to consume (no-cache)
    @GetMapping(value = "/latest.json")
    @ResponseBody
    public org.springframework.http.ResponseEntity<GameCharacter> latestCharacterJson() {
        GameCharacter latest = characterRepository.findTopByOrderByIdDesc();
        return org.springframework.http.ResponseEntity.ok()
                .cacheControl(org.springframework.http.CacheControl.noStore())
                .header("Pragma", "no-cache")
                .header("Expires", "0")
                .body(latest);
    }

    // Fetch character by ID (for starting with a saved character) (no-cache)
    @GetMapping(value = "/{id}.json")
    @ResponseBody
    public org.springframework.http.ResponseEntity<GameCharacter> characterById(@PathVariable Long id) {
        GameCharacter ch = characterRepository.findById(id).orElse(null);
        return org.springframework.http.ResponseEntity.ok()
                .cacheControl(org.springframework.http.CacheControl.noStore())
                .header("Pragma", "no-cache")
                .header("Expires", "0")
                .body(ch);
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
        // Enforce starting values regardless of form inputs
        if (character.getLevel() <= 0) character.setLevel(1);
        character.setXp(0);
        character.setGold(100);
        service.saveCharacter(character);
        Long id = character.getId();
        return id != null ? "redirect:/play/map?charId=" + id : "redirect:/play/map";
    }

    // --- Minimal REST API for store and equipment ---
    public static class BuyRequest { public String item; }
    public static class EquipRequest { public String weapon; }
    public static class ApiResponse {
        public boolean ok; public String message; public GameCharacter character;
        public ApiResponse(boolean ok, String message, GameCharacter ch){ this.ok=ok; this.message=message; this.character=ch; }
    }
    // State save request (persist player state on events like death)
    public static class SaveStateRequest {
        public Integer health; public Integer maxHealth; public Integer armor; public Integer gold;
        public Integer level; public Integer xp; public Integer attack; public Integer defense;
        public Integer magic; public Integer mana; public String weapon; public String inventory;
        public String skinColor; public String shirtColor; public String pantsColor; public String charClass;
        public String spells; public String equippedSpell;
    }

    @PostMapping("/api/{id}/buy")
    @ResponseBody
    public ApiResponse buy(@PathVariable Long id, @RequestBody BuyRequest req){
        GameCharacter ch = characterRepository.findById(id).orElse(null);
        if(ch==null) return new ApiResponse(false, "Character not found", null);
        String item = (req!=null && req.item!=null)? req.item.trim() : "";
        if(item.isEmpty()) return new ApiResponse(false, "No item specified", ch);
        int price = switch(item){
            case "Potion" -> 25;
            case "Shield" -> 100;
            case "Armor" -> 50;
            case "Sword" -> 100;
            case "Mace" -> 120;
            case "Axe" -> 140;
            case "Scythe" -> 150;
            case "Bow" -> 200;
            case "Staff" -> 250;
            default -> 20;
        };
        if(ch.getGold() < price) return new ApiResponse(false, "Not enough gold", ch);
        // pay
        ch.setGold(ch.getGold() - price);
        // add to inventory CSV
        String inv = (ch.getInventory()==null? "" : ch.getInventory());
        if(!inv.isEmpty()) inv += ",";
        inv += item;
        ch.setInventory(inv);
        // apply immediate effects
        if("Potion".equals(item)){
            int newHp = Math.min(ch.getHealth(), ch.getHealth()); // placeholder: potions apply in-game client; keep server neutral
        } else if("Shield".equals(item)){
            ch.setArmor(ch.getArmor()+5);
        } else if("Armor".equals(item)){
            ch.setArmor(ch.getArmor()+10);
        } else if(isWeapon(item)){
            // do not force-equip, just leave in inventory; player can equip via /equip
        }
        characterRepository.save(ch);
        return new ApiResponse(true, "You bought " + item, ch);
    }

    private boolean isWeapon(String item){
        return "Sword".equalsIgnoreCase(item) || "Axe".equalsIgnoreCase(item) || "Mace".equalsIgnoreCase(item)
                || "Scythe".equalsIgnoreCase(item) || "Bow".equalsIgnoreCase(item) || "Staff".equalsIgnoreCase(item);
    }

    @PostMapping("/api/{id}/equip")
    @ResponseBody
    public ApiResponse equip(@PathVariable Long id, @RequestBody EquipRequest req){
        GameCharacter ch = characterRepository.findById(id).orElse(null);
        if(ch==null) return new ApiResponse(false, "Character not found", null);
        String weap = (req!=null && req.weapon!=null) ? req.weapon.trim() : "";
        if(weap.isEmpty()) return new ApiResponse(false, "No weapon specified", ch);
        String inv = ch.getInventory()==null? "" : ch.getInventory();
        boolean owned = (","+inv+",").toLowerCase().contains(","+weap.toLowerCase()+",");
        if(!owned) return new ApiResponse(false, "Weapon not owned", ch);
        ch.setWeapon(weap);
        characterRepository.save(ch);
        return new ApiResponse(true, "Equipped " + weap, ch);
    }

    @PostMapping("/api/{id}/saveState")
    @ResponseBody
    public ApiResponse saveState(@PathVariable Long id, @RequestBody SaveStateRequest req){
        GameCharacter ch = characterRepository.findById(id).orElse(null);
        if(ch==null) return new ApiResponse(false, "Character not found", null);
        if(req==null) return new ApiResponse(false, "No state provided", ch);
        // Only update provided fields
        if(req.health!=null) ch.setHealth(req.health);
        if(req.maxHealth!=null) { ch.setHealth(Math.min(req.health!=null?req.health:ch.getHealth(), req.maxHealth)); }
        if(req.armor!=null) ch.setArmor(req.armor);
        if(req.gold!=null) ch.setGold(req.gold);
        // Prevent regression due to out-of-order saves: only increase level/xp
        if(req.level!=null && req.level >= ch.getLevel()) ch.setLevel(req.level);
        if(req.xp!=null && req.xp >= ch.getXp()) ch.setXp(req.xp);
        if(req.attack!=null) ch.setAttack(req.attack);
        if(req.defense!=null) ch.setDefense(req.defense);
        if(req.magic!=null) ch.setMagic(req.magic);
        if(req.mana!=null) ch.setMana(req.mana);
        if(req.weapon!=null) ch.setWeapon(req.weapon);
        if(req.inventory!=null) ch.setInventory(req.inventory);
        if(req.skinColor!=null) ch.setSkinColor(req.skinColor);
        if(req.shirtColor!=null) ch.setShirtColor(req.shirtColor);
        if(req.pantsColor!=null) ch.setPantsColor(req.pantsColor);
        if(req.charClass!=null) ch.setCharClass(req.charClass);
        if(req.spells!=null) ch.setSpells(req.spells);
        if(req.equippedSpell!=null) ch.setEquippedSpell(req.equippedSpell);
        characterRepository.save(ch);
        return new ApiResponse(true, "State saved", ch);
    }
}
