document.addEventListener('DOMContentLoaded', () => {
    let jsonData = {};
    let jsonTitle = "Default Title"; // Default title

    // Function to update the JSON title based on the selected file
    function updateJsonTitle() {
        const selectElement = document.getElementById('file-list');
        jsonTitle = selectElement.options[selectElement.selectedIndex].text;
    }

    // Function to search and load JSON file
    async function searchJSON() {
        const keyword = document.getElementById('search-bar').value;
        if (keyword) {
            try {
                const response = await fetch('/list-files');
                if (!response.ok) throw new Error('Error fetching file list');
                const files = await response.json();
                const filteredFiles = files.filter(file => file.toLowerCase().includes(keyword.toLowerCase()));

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

    // Function to filter and display the JSON data
    function filterAndDisplayData() {
        const filterType = document.getElementById('filter-type').value;
        const tbody = document.getElementById('data-table').querySelector('tbody');
        tbody.innerHTML = '';

        let totalFields = 0;
        if (jsonData.children) {
            jsonData.children.forEach(parentGroup => {
                let parentGroupAdded = false;

                if (parentGroup.children) {
                    // Filter main group questions
                    const mainGroupQuestions = parentGroup.children.filter(item => !item.children);
                    const filteredMainGroupQuestions = mainGroupQuestions.filter(item => {
                        return filterType === 'all' || item.required_rule === 'always';
                    });

                    if (filteredMainGroupQuestions.length > 0) {
                        const groupRow = document.createElement('tr');
                        groupRow.classList.add('table-success'); // Apply the Bootstrap success color
                        groupRow.innerHTML = `<td colspan="4"><strong>${parentGroup.title}</strong></td>`;
                        tbody.appendChild(groupRow);
                        parentGroupAdded = true;

                        filteredMainGroupQuestions.forEach(item => {
                            const row = document.createElement('tr');
                            row.innerHTML = `<td style="word-wrap: break-word; max-width: 200px;">${item.identifier}</td><td>${parentGroup.title}</td><td>${item.title}</td><td>${filterType === 'all' && item.required_rule !== 'always' ? 'Not Required' : 'Required'}</td>`;
                            tbody.appendChild(row);
                        });

                        totalFields += filteredMainGroupQuestions.length;
                    }

                    // Filter subgroup questions
                    const subGroups = parentGroup.children.filter(item => item.children);
                    subGroups.forEach(childGroup => {
                        const filteredData = childGroup.children.filter(item => {
                            return filterType === 'all' || item.required_rule === 'always';
                        });

                        if (filteredData.length > 0) {
                            if (!parentGroupAdded) {
                                const groupRow = document.createElement('tr');
                                groupRow.classList.add('table-success'); // Apply the Bootstrap success color
                                groupRow.innerHTML = `<td colspan="4"><strong>${parentGroup.title}</strong></td>`;
                                tbody.appendChild(groupRow);
                                parentGroupAdded = true;
                            }

                            filteredData.forEach(item => {
                                const row = document.createElement('tr');
                                row.innerHTML = `<td style="word-wrap: break-word; max-width: 200px;">${item.identifier}</td><td>${parentGroup.title} / ${childGroup.title}</td><td>${item.title}</td><td>${filterType === 'all' && item.required_rule !== 'always' ? 'Not Required' : 'Required'}</td>`;
                                tbody.appendChild(row);
                            });

                            totalFields += filteredData.length;
                        }
                    });
                }
            });

            document.getElementById('total-fields').textContent = `Total fields: ${totalFields}`;
        } else {
            console.log('No children found in JSON data');
        }
    }

    // Function to export the filtered data to Excel
    function exportToExcel() {
        const rows = [];
        const filterType = document.getElementById('filter-type').value;

        if (jsonData.children) {
            jsonData.children.forEach(parentGroup => {
                if (parentGroup.children) {
                    // Main group questions
                    const mainGroupQuestions = parentGroup.children.filter(item => !item.children);
                    const filteredMainGroupQuestions = mainGroupQuestions.filter(item => {
                        return filterType === 'all' || item.required_rule === 'always';
                    });

                    if (filteredMainGroupQuestions.length > 0) {
                        filteredMainGroupQuestions.forEach(item => {
                            rows.push({
                                group: parentGroup.title,
                                identifier: item.identifier,
                                title: item.title,
                                required_rule: filterType === 'all' && item.required_rule !== 'always' ? 'Not Required' : 'Required'
                            });
                        });
                    }

                    // Subgroup questions
                    const subGroups = parentGroup.children.filter(item => item.children);
                    subGroups.forEach(childGroup => {
                        const filteredData = childGroup.children.filter(item => {
                            return filterType === 'all' || item.required_rule === 'always';
                        });

                        if (filteredData.length > 0) {
                            filteredData.forEach(item => {
                                rows.push({
                                    group: `${parentGroup.title} / ${childGroup.title}`,
                                    identifier: item.identifier,
                                    title: item.title,
                                    required_rule: filterType === 'all' && item.required_rule !== 'always' ? 'Not Required' : 'Required'
                                });
                            });
                        }
                    });
                }
            });
        }

        if (rows.length === 0) {
            alert('No data to export');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(rows, { header: ["group", "identifier", "title", "required_rule"] });

        // Create a new workbook and append the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, jsonTitle);

        // Set column widths for better readability
        worksheet['!cols'] = [{ wpx: 200 }, { wpx: 150 }, { wpx: 200 }, { wpx: 150 }];

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

    // Export the functions to the global scope so they can be called from the HTML
    window.searchJSON = searchJSON;
    window.loadSelectedFile = loadSelectedFile;
    window.filterAndDisplayData = filterAndDisplayData;
    window.exportToExcel = exportToExcel;
    window.runScript = runScript;
});
