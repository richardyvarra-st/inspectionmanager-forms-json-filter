let jsonData = {};
let jsonTitle = "Default Title"; // Default title

function updateJsonTitle() {
    const selectElement = document.getElementById('file-list');
    jsonTitle = selectElement.options[selectElement.selectedIndex].text;
    // You can also fetch the JSON data here based on selection
    // e.g., loadData(jsonTitle);
}

// Function to search and load JSON file
async function searchJSON() {
    const keyword = document.getElementById('search-bar').value;
    if (keyword) {
        try {
            const response = await fetch('/list-files');
            if (!response.ok) throw new Error('Error fetching file list');
            const files = await response.json();
            const filteredFiles = files.filter(file => file.includes(keyword));

            const fileList = document.getElementById('file-list');
            fileList.innerHTML = '';
            filteredFiles.forEach(file => {
                const option = document.createElement('option');
                option.value = file;
                option.textContent = file;
                fileList.appendChild(option);
            });

            if (filteredFiles.length > 0) {
                loadSelectedFile();
            } else {
                alert('No files found');
            }
        } catch (error) {
            console.error('Error fetching file list:', error);
            alert('Error loading file list');
        }
    } else {
        alert('Please enter a search keyword');
    }
}

// Function to load the selected file
async function loadSelectedFile() {
    const fileList = document.getElementById('file-list');
    const selectedFile = fileList.value;
    if (selectedFile) {
        try {
            const response = await fetch(`/files/${selectedFile}`);
            if (!response.ok) throw new Error('Error fetching JSON file');
            jsonData = await response.json();
            filterAndDisplayData();
        } catch (error) {
            console.error('Error fetching JSON:', error);
            alert('Error loading JSON file');
        }
    }
}

// Function to flatten nested JSON data
function flattenData(data) {
    let result = [];

    function recurse(children) {
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (child.children) {
                    recurse(child.children);
                }
                result.push(child);
            });
        }
    }

    recurse(data.children);
    return result;
}

// Function to filter and display the JSON data
function filterAndDisplayData() {
    const tbody = document.getElementById('data-table').querySelector('tbody');
    tbody.innerHTML = '';

    if (jsonData && jsonData.children) {
        // Flatten nested data
        const flatData = flattenData(jsonData);

        // Filter the flattened data
        const filteredData = flatData.filter(item => item.required_rule === 'always');

        // Update total fields count
        document.getElementById('total-fields').textContent = `Total fields: ${filteredData.length}`;

        // Debugging: Log the filtered data
        console.log('Filtered data:', filteredData);

        filteredData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${item.identifier}</td><td>${item.title}</td><td>${item.required_rule}</td>`;
            tbody.appendChild(row);
        });

        return filteredData;
    } else {
        console.log('No children found in JSON data');
        document.getElementById('total-fields').textContent = 'Total fields: 0';
        return [];
    }
}
// Function to export the filtered data to Excel with formatting
function exportToExcel() {
    const filteredData = filterAndDisplayData().map(({ identifier, title, required_rule }) => ({ identifier, title, required_rule }));
    const worksheet = XLSX.utils.json_to_sheet(filteredData);

    // Define the styles
    const headerStyle = {
        font: { bold: true },
        fill: {
            fgColor: { rgb: "0000FF" } // Blue background color
        }
    };

    // Function to apply styles to a cell
    const applyStyle = (cell, style) => {
        if (!worksheet[cell]) worksheet[cell] = { t: "s", v: "" };
        worksheet[cell].s = style;
    };

    // Apply the header style to the first row
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let C = range.s.c; C <= range.e.c; C++) {
        const cell_address = XLSX.utils.encode_cell({ c: C, r: range.s.r });
        applyStyle(cell_address, headerStyle);
    }

    // Create a new workbook and append the styled worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, jsonTitle);

    // Set column widths for better readability
    worksheet['!cols'] = [{ wpx: 100 }, { wpx: 200 }, { wpx: 150 }];

    // Write the workbook to a file
    XLSX.writeFile(workbook, 'filtered_data.xlsx');
}

// Function to run a script
function runScript() {
    // Example script content
    const scriptContent = 'console.log("Script executed");';
    const blob = new Blob([scriptContent], { type: 'text/javascript' });
    saveAs(blob, 'script.js');
}
