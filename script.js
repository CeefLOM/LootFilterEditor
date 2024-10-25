// Toggle collapsible boxes
const collapsibles = document.querySelectorAll('.collapsible-box h2');
collapsibles.forEach(header => {
    header.addEventListener('click', () => {
        const box = header.parentElement;
        const content = header.nextElementSibling;
        content.style.display = content.style.display === 'block' ? 'none' : 'block';
        box.classList.toggle('collapsed');
    });
});

// Fetch data from itemdb.json
fetch('data/itemdb.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(itemsData => {
        populateCategories(itemsData);
    })
    .catch(error => {
        console.error("Error loading item data:", error);
    });

// Populate categories in dropdown
function populateCategories(itemsData) {
    const categorySelect = document.getElementById('category');
    const subcategorySelect = document.getElementById('subcategory');
    
    const uniqueCategories = [...new Set(itemsData.map(item => item.Category))];
    uniqueCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });

    categorySelect.addEventListener('change', function() {
        populateSubcategories(itemsData, this.value);
    });
    
    subcategorySelect.addEventListener('change', function() {
        populateItems(itemsData, categorySelect.value, this.value);
    });
}

// Populate subcategories based on selected category
function populateSubcategories(itemsData, selectedCategory) {
    const subcategorySelect = document.getElementById('subcategory');
    subcategorySelect.innerHTML = '<option value="">-- Choose Subcategory --</option>';

    const subcategories = [...new Set(itemsData.filter(item => item.Category === selectedCategory).map(item => item.SubCategory))];
    subcategories.forEach(subcategory => {
        const option = document.createElement('option');
        option.value = subcategory;
        option.textContent = subcategory;
        subcategorySelect.appendChild(option);
    });
}

// Populate items based on selected subcategory
function populateItems(itemsData, selectedCategory, selectedSubcategory) {
    const itemListDiv = document.getElementById('item-list');
    itemListDiv.innerHTML = '';

    const items = itemsData.filter(item => item.Category === selectedCategory && item.SubCategory === selectedSubcategory);
    const tiers = { Normal: [], Exceptional: [], Elite: [] };

    items.forEach(item => {
        tiers[item.Tier].push(item);
    });

    const columnsContainer = document.createElement('div');
    columnsContainer.className = 'tier-columns';

    Object.entries(tiers).forEach(([tierName, itemsArray]) => {
        const column = document.createElement('div');
        column.className = 'tier-column';
        const header = document.createElement('h4');
        header.textContent = tierName;
        column.appendChild(header);
        itemsArray.forEach(item => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.dataset.code = item.ItemCode;
            checkbox.type = 'checkbox';
            checkbox.name = 'items';
            checkbox.value = item.Name;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(item.Name));
            column.appendChild(label);
        });
        columnsContainer.appendChild(column);
    });

    itemListDiv.appendChild(columnsContainer);
}

// Manage selected items
let selectedItems = [];
document.getElementById('add-items-button').addEventListener('click', function() {
    const checkedItems = document.querySelectorAll('input[name="items"]:checked');
    checkedItems.forEach(checkbox => {
        const itemName = checkbox.value;
        const itemCode = checkbox.dataset.code;
        if (!selectedItems.some(item => item.ItemCode === itemCode)) {
            selectedItems.push({ Name: itemName, ItemCode: itemCode });
            displaySelectedItems();
        }
    });
});

// Display selected items
function displaySelectedItems() {
    const selectedItemsDiv = document.getElementById('selected-items');
    selectedItemsDiv.innerHTML = '';

    selectedItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'selected-item';

        const itemName = document.createElement('span');
        itemName.textContent = item.Name;

        const removeButton = document.createElement('span');
        removeButton.textContent = ' X';
        removeButton.className = 'remove-item';
        removeButton.onclick = () => removeSelectedItem(index);

        itemDiv.appendChild(itemName);
        itemDiv.appendChild(removeButton);
        selectedItemsDiv.appendChild(itemDiv);
    });

    updateGeneratedRule();  // Update the rule when items are displayed
}

// Remove selected item
function removeSelectedItem(index) {
    selectedItems.splice(index, 1);
    displaySelectedItems();
}

// Manage selected rarities
let selectedRarities = [];
fetch('data/rarity.json')
    .then(response => response.json())
    .then(raritiesData => {
        const raritySelectionDiv = document.getElementById('rarity-selection');
        raritiesData.forEach(rarity => {
            const rarityDiv = document.createElement('div');
            rarityDiv.classList.add('rarity-entry');

            const trueCheckbox = createRarityCheckbox(rarity, false);
            const falseCheckbox = createRarityCheckbox(rarity, true);

            rarityDiv.appendChild(trueCheckbox);
            rarityDiv.appendChild(falseCheckbox);
            raritySelectionDiv.appendChild(rarityDiv);
        });
    })
    .catch(error => {
        console.error("Error loading rarity data:", error);
    });

// Create a rarity checkbox
function createRarityCheckbox(rarity, isFalse) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = isFalse ? 'rarity-false' : 'rarity-true';
    checkbox.value = isFalse ? `!${rarity.CODE}` : rarity.CODE;

    const label = document.createElement('label');
    label.textContent = rarity["Rarity:"];
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            const otherCheckbox = document.querySelector(`input[name="${isFalse ? 'rarity-true' : 'rarity-false'}"][value="${isFalse ? rarity.CODE : `!${rarity.CODE}`}"]`);
            if (otherCheckbox) {
                otherCheckbox.checked = false;
            }
            addRarity(this.value);
        } else {
            removeRarity(this.value);
        }
    });

    return label.appendChild(checkbox), label;
}

// Add/remove rarities
function addRarity(rarityCode) {
    if (!selectedRarities.includes(rarityCode)) {
        selectedRarities.push(rarityCode);
        updateGeneratedRule();
    }
}

function removeRarity(rarityCode) {
    const index = selectedRarities.indexOf(rarityCode);
    if (index > -1) {
        selectedRarities.splice(index, 1);
        updateGeneratedRule();
    }
}

// Manage selected mods
let selectedMods = [];
fetch('data/mods.json')
    .then(response => response.json())
    .then(modsData => {
        const modDropdown = document.getElementById('mod-dropdown');
        modsData.forEach(mod => {
            const option = document.createElement('option');
            option.value = mod.Code;
            option.textContent = mod.Name;
            modDropdown.appendChild(option);
        });
    })
    .catch(error => {
        console.error("Error loading mods data:", error);
    });

document.getElementById('operator-tags').addEventListener('change', updateGeneratedRule);
document.getElementById('add-mod-button').addEventListener('click', function() {
    const modDropdown = document.getElementById('mod-dropdown');
    const argTag = document.getElementById('arg-tags').value;
    const additionalInfo = document.getElementById('additional-info').value;

    if (modDropdown.value) {
        const mod = { code: modDropdown.value, argTag, additionalInfo };
        selectedMods.push(mod);
        displaySelectedMods();
        modDropdown.value = "";
        document.getElementById('additional-info').value = "";
        document.getElementById('operator-tags').style.display = selectedMods.length > 1 ? 'block' : 'none';
        updateGeneratedRule();
    } else {
        alert("Please select a mod.");
    }
});

// Display selected mods
function displaySelectedMods() {
    const modListDiv = document.getElementById('mod-list');
    modListDiv.innerHTML = '';

    selectedMods.forEach((mod, index) => {
        const modDiv = document.createElement('div');
        modDiv.textContent = `${mod.code} ${mod.argTag} ${mod.additionalInfo}`;
        modDiv.className = 'selected-mod';

        const removeButton = document.createElement('span');
        removeButton.textContent = ' X';
        removeButton.className = 'remove-mod';
        removeButton.onclick = () => {
            removeMod(index);
        };

        modDiv.appendChild(removeButton);
        modListDiv.appendChild(modDiv);
    });
}

// Remove mod
function removeMod(index) {
    selectedMods.splice(index, 1);
    displaySelectedMods();
    updateGeneratedRule();
}

// Skill Panel Logic
// Array to store selected skills
let selectedSkills = [];
let selectedLogic = "OR";  // Default to AND

// Event listener to detect changes to the AND/OR radio buttons
document.querySelectorAll('input[name="and-or"]').forEach(radio => {
    radio.addEventListener('change', function() {
        selectedLogic = this.value;  // Update logic when radio button changes
        updateGeneratedRule();  // Update the rule dynamically
    });
});

// Fetch skills data from skills.json
fetch('data/skills.json')
    .then(response => response.json())
    .then(skillsData => {
        // Extract unique categories from the skills data
        const skillCategories = [...new Set(skillsData.map(skill => skill.Category))];
        const categorySelect = document.getElementById('skill-category');
        const nameSelect = document.getElementById('skill-name');
        const addSkillButton = document.getElementById('add-skill');
        const selectedSkillsDiv = document.getElementById('selected-skills');

        // Populate the skill category dropdown
        skillCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });

        // Event listener for when a category is selected
        categorySelect.addEventListener('change', function() {
            const selectedCategory = this.value;

            // Reset the skill name dropdown
            nameSelect.innerHTML = '<option value="">-- Choose Skill --</option>';
            nameSelect.disabled = false; // Enable the dropdown when category is selected

            // Populate the skill names based on the selected category
            const filteredSkills = skillsData.filter(skill => skill.Category === selectedCategory);
            filteredSkills.forEach(skill => {
                const option = document.createElement('option');
                option.value = skill.CODE;
                option.textContent = skill.Name;
                nameSelect.appendChild(option);
            });
        });

        // Event listener for when a skill name is selected
        nameSelect.addEventListener('change', function() {
            const selectedSkill = this.value;
            addSkillButton.disabled = !selectedSkill; // Enable Add button if a skill is selected
        });

        // Event listener for Add Skill button
        addSkillButton.addEventListener('click', function() {
            const selectedSkillCode = nameSelect.value;
            const selectedSkillName = nameSelect.options[nameSelect.selectedIndex].text;
            const comparisonOperator = document.querySelector('input[name="comparison"]:checked').value;
            const skillLevel = document.getElementById('skill-level').value;

            // Add skill only if it's not already added
            if (selectedSkillCode && !selectedSkills.some(skill => skill.code === selectedSkillCode)) {
                selectedSkills.push({ code: selectedSkillCode, name: selectedSkillName, comparison: comparisonOperator, level: skillLevel });
                displaySelectedSkills();
            }
        });

        // Function to display selected skills
        function displaySelectedSkills() {
            const selectedSkillsDiv = document.getElementById('selected-skills');
            selectedSkillsDiv.innerHTML = '';  // Clear current display

            if (selectedSkills.length > 0) {
                const title = document.createElement('h3');
                title.textContent = "Selected Skills:";
                selectedSkillsDiv.appendChild(title);
            }

            selectedSkills.forEach((skill, index) => {
                const skillDiv = document.createElement('div');
                skillDiv.className = 'selected-skill';

                const skillInfo = document.createElement('span');
                skillInfo.textContent = `${skill.code} ${skill.comparison} ${skill.level}`;  // Display skill info

                const removeButton = document.createElement('span');
                removeButton.textContent = ' X';
                removeButton.className = 'remove-skill';
                removeButton.onclick = () => {
                    removeSkill(skill.code);
                };

                skillDiv.appendChild(skillInfo);
                skillDiv.appendChild(removeButton);
                selectedSkillsDiv.appendChild(skillDiv);
            });

            updateGeneratedRule();  // Update the rule when the skills are displayed
        }

        // Function to remove a skill from the selected skills list
        function removeSkill(skillCode) {
            selectedSkills = selectedSkills.filter(skill => skill.code !== skillCode);
            displaySelectedSkills();
        }
    })
    .catch(error => {
        console.error("Error loading skills data:", error);
    });





// BASICS LOGIC
// Manage selected basics
let selectedBasics = [];
const basics = [
    { CODE: 'ID', label: 'Identified' },
    { CODE: 'INF', label: 'Inferior' },
    { CODE: 'SUP', label: 'Superior' },
    { CODE: 'ETH', label: 'Ethereal' },
    { CODE: 'RW', label: 'Runeword' },
    { CODE: 'GEMMED', label: 'Gemmed' }
];

const basicsSelectionDiv = document.getElementById('basics-selection');

// Loop through basics and create checkboxes for each
basics.forEach(basic => {
    const basicsDiv = document.createElement('div');
    basicsDiv.classList.add('entry');

    // True checkbox
    const trueCheckbox = document.createElement('input');
    trueCheckbox.type = 'checkbox';
    trueCheckbox.name = `basic-${basic.CODE}-true`;
    trueCheckbox.value = basic.CODE;

    // False checkbox
    const falseCheckbox = document.createElement('input');
    falseCheckbox.type = 'checkbox';
    falseCheckbox.name = `basic-${basic.CODE}-false`;
    falseCheckbox.value = `!${basic.CODE}`;

    // Event listener for true checkbox
    trueCheckbox.addEventListener('change', function() {
        if (this.checked) {
            // Uncheck the corresponding false checkbox
            falseCheckbox.checked = false;
            addBasic(this.value);
            // Exclusive logic for Inferior and Superior
            if (basic.CODE === 'INF') {
                document.querySelector(`input[name="basic-SUP-true"]`).checked = false;
                document.querySelector(`input[name="basic-SUP-false"]`).checked = false;
            } else if (basic.CODE === 'SUP') {
                document.querySelector(`input[name="basic-INF-true"]`).checked = false;
                document.querySelector(`input[name="basic-INF-false"]`).checked = false;
            }
        } else {
            removeBasic(this.value);
        }
        updateSelectedBasics(); // Update basics selection
    });

    // Event listener for false checkbox
    falseCheckbox.addEventListener('change', function() {
        if (this.checked) {
            // Uncheck the corresponding true checkbox
            trueCheckbox.checked = false;
            addBasic(this.value);
            // Exclusive logic for Inferior and Superior
            if (basic.CODE === 'INF') {
                document.querySelector(`input[name="basic-SUP-true"]`).checked = false;
                document.querySelector(`input[name="basic-SUP-false"]`).checked = false;
            } else if (basic.CODE === 'SUP') {
                document.querySelector(`input[name="basic-INF-true"]`).checked = false;
                document.querySelector(`input[name="basic-INF-false"]`).checked = false;
            }
        } else {
            removeBasic(this.value);
        }
        updateSelectedBasics(); // Update basics selection
    });

    const labelTrue = document.createElement('label');
    labelTrue.textContent = ` ${basic.label} (True)`;
    
    const labelFalse = document.createElement('label');
    labelFalse.textContent = ` ${basic.label} (False)`;

    basicsDiv.appendChild(trueCheckbox);
    basicsDiv.appendChild(labelTrue);
    basicsDiv.appendChild(falseCheckbox);
    basicsDiv.appendChild(labelFalse);
    basicsSelectionDiv.appendChild(basicsDiv);
});

// Add/remove basics
function addBasic(basicCode) {
    if (!selectedBasics.includes(basicCode)) {
        selectedBasics.push(basicCode);
        updateGeneratedRule();
    }
}

function removeBasic(basicCode) {
    const index = selectedBasics.indexOf(basicCode);
    if (index > -1) {
        selectedBasics.splice(index, 1);
        updateGeneratedRule();
    }
}

// Update selected basics
function updateSelectedBasics() {
    selectedBasics = []; // Clear the selectedBasics array

    basics.forEach(basic => {
        const trueCheckbox = document.querySelector(`input[name="basic-${basic.CODE}-true"]`);
        const falseCheckbox = document.querySelector(`input[name="basic-${basic.CODE}-false"]`);
        if (trueCheckbox.checked) {
            selectedBasics.push(basic.CODE);
        }
        if (falseCheckbox.checked) {
            selectedBasics.push(`!${basic.CODE}`);
        }
    });

    console.log('Selected Basics:', selectedBasics); // Debugging: check if the basics are selected correctly

    // Update rule generation with selected basics
    updateGeneratedRule();
}

// Ensure the updateSelectedBasics function is called whenever a checkbox state changes
document.querySelectorAll('input[name^="basic-"]').forEach(checkbox => {
    checkbox.addEventListener('change', updateSelectedBasics);
});


// Manage selected sockets and tiers
let selectedSockets = [];
let selectedTiers = [];

document.querySelectorAll('input[name="sockets"]').forEach(checkbox => {
    checkbox.addEventListener('change', updateSelectedSockets);
});

document.querySelectorAll('input[name="socket-modifier"]').forEach(radio => {
    radio.addEventListener('change', updateSelectedSockets);
});

document.querySelectorAll('input[name^="tier-"]').forEach(radio => {
    radio.addEventListener('change', updateSelectedTiers);
});

// Update selected sockets
function updateSelectedSockets() {
    const selectedModifier = document.querySelector('input[name="socket-modifier"]:checked').value;
    const selectedSocketNumbers = [...document.querySelectorAll('input[name="sockets"]:checked')].map(sock => sock.value);
    
    selectedSockets = selectedSocketNumbers.map(socketNumber => `SOCK${selectedModifier}${socketNumber}`);
    updateGeneratedRule();
}

// Update selected tiers
function updateSelectedTiers() {
    selectedTiers = [];
    
    const normTier = document.querySelector('input[name="tier-NORM"]:checked')?.value;
    const excTier = document.querySelector('input[name="tier-EXC"]:checked')?.value;
    const eltTier = document.querySelector('input[name="tier-ELT"]:checked')?.value;

    if (normTier) selectedTiers.push(normTier);
    if (excTier) selectedTiers.push(excTier);
    if (eltTier) selectedTiers.push(eltTier);
    
    updateGeneratedRule();
}

// Update the generated rule
function updateGeneratedRule() {
    const ruleBox = document.getElementById('generated-rule');
    let rule = "ItemDisplay[";

    // Add selected basics with OR operators
    if (selectedBasics.length > 0) {
        rule += `(${selectedBasics.join(" OR ")}) `; // Join basics with OR
    }

    // Add selected rarities
    if (selectedRarities.length > 0) {
        rule += selectedRarities.length > 1 ? `(${selectedRarities.join(" OR ")}) ` : `${selectedRarities[0]} `;
    }

    // Add selected sockets
    if (selectedSockets.length > 0) {
        rule += `(${selectedSockets.join(" OR ")}) `;
    }

    // Add selected tiers
    if (selectedTiers.length > 0) {
        rule += `(${selectedTiers.join(" OR ")}) `;
    }

    // Add item codes
    if (selectedItems.length > 0) {
        rule += `(${selectedItems.map(item => item.ItemCode).join(" OR ")}) `;
    }
    
    // Add selected mods
    if (selectedMods.length > 0) {
        const modEntries = selectedMods.map(mod => {
            if (mod.argTag === "None") {
                return mod.code; 
            } else if (mod.argTag === "True") {
                return `${mod.code}=TRUE`; 
            } else if (mod.argTag === "False") {
                return `${mod.code}=FALSE`; 
            } else {
                return `${mod.code}${mod.argTag}(${mod.additionalInfo})`;
            }
        });

        const operator = selectedMods.length > 1 ? document.getElementById('operator-tags').value : "";
        rule += selectedMods.length > 1 ? `(${modEntries.join(` ${operator} `)}) ` : modEntries[0];
    }

    // Add selected skills
    if (selectedSkills.length > 0) {
        const selectedLogic = document.querySelector('input[name="and-or"]:checked').value; 
        rule += selectedSkills.length > 1 
            ? `(${selectedSkills.map(skill => `${skill.code}${skill.comparison}${skill.level}`).join(` ${selectedLogic} `)}) `
            : `${selectedSkills[0].code}${selectedSkills[0].comparison}${selectedSkills[0].level} `;
    }

    rule = rule.trim() + "]:"; 
    ruleBox.value = rule; // Update the rule box with the generated rule
}
