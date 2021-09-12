import { weaponTypes, sortedAttackTypes, concealability, availability, reliability, attackSkills, meleeAttackTypes, getStatNames, cyberdeckTypes, programClasses } from "../lookups.js";
import { formulaHasDice } from "../dice.js";
import { localize } from "../utils.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class CyberpunkItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["cyberpunk", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/cyberpunk2020/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.hbs`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.hbs`.
    return `${path}/item-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // This means the handlebars data and the form edit data actually mirror each other
    const data = super.getData();
    const actorData = data.data;
    data.actor = actorData;
    data.data = actorData.data;

    switch (this.item.data.type) {
      case "weapon":
        this._prepareWeapon(data);
        break;
    
      case "armor":
        this._prepareArmor(data);

      case "skill":
        this._prepareSkill(data);

      case "cyberdeck":
        this._prepareCyberdeck(data);

      case "program":
        this._preparePrograms(data);

      default:
        break;
    }
    return data;
  }

  _prepareSkill(data) {
    data.stats = getStatNames();
  }

  _prepareWeapon(data) {
    data.weaponTypes = Object.values(weaponTypes).sort();
    if(this.item.data.data.weaponType === weaponTypes.melee) {
      data.attackTypes = Object.values(meleeAttackTypes).sort();
    }
    else {
      data.attackTypes = sortedAttackTypes;
    }
    data.concealabilities = Object.values(concealability);
    data.availabilities = Object.values(availability);
    data.reliabilities = Object.values(reliability);
    data.attackSkills = [...attackSkills[this.item.data.data.weaponType].map(x => localize("Skill"+x)), ...(this.actor?.trainedMartials() || [])];

    // TODO: Be not so inefficient for this
    if(!data.attackSkills.length && this.actor) {
      if(this.actor) {
        data.attackSkills = this.actor.itemTypes.skill.map(skill => skill.name).sort();
      }
    }
  }

  _prepareArmor(data) {
    
  }

  _prepareCyberdeck(data) {
    data.cyberdeckTypes = Object.values(cyberdeckTypes);
  }
  
_preparePrograms(data) {
	data.programClasses = Object.values(programClasses);
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Roll handlers, click handlers, etc. would go here, same as actor sheet.
    html.find(".item-roll").click(this.item.roll.bind(this));

    html.find(".accel").click(() => this.item.accel());
    html.find(".decel").click(() => this.item.accel(true));
    
    // roll for humanity loss on cyberware 
    html.find('.humanity-cost-roll').click( ev => {
      ev.stopPropagation();
      let item = this.object;
      const hc = item.data.data.humanityCost;
      let loss = 0;
      // determine if humanity cost is a number or dice
      if (formulaHasDice(hc)) {
        // roll the humanity cost
        let r = new Roll(hc).roll();
        loss = r.total ? r.total : 0;
      } else {
        const num = Number(hc);
        loss = (isNaN(num)) ? 0 : num;
      }
      item.update({
        "data.humanityLoss": loss
      });
      item.sheet.render(true);
    });
  }
  
}
