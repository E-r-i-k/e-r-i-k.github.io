
let salaryChart; // Variable to hold the chart instance
let currentSortColumnIndex = null; // Track which column is sorted
let currentSortOrder = 'asc'; // Track current sort order

document.addEventListener("DOMContentLoaded", () => {
    const jobListings = document.getElementById('job-listings');
    const titleFilter = document.getElementById('title-filter');
    const companyFilter = document.getElementById('company-filter');
    const locationFilter = document.getElementById('location-filter');
    const salaryFilter = document.getElementById('salary-filter');
    const maxSalaryFilter = document.getElementById('max-salary-filter');
    const jobTypeFilter = document.getElementById('job-type-filter');
    const experienceFilter = document.getElementById('experience-filter');
    const employmentTypeFilter = document.getElementById('employment-type-filter');
    const workArrangementFilter = document.getElementById('work-arrangement-filter');
    const dateFilter = document.getElementById('date-filter');

    const minSalaryElem = document.getElementById('min-salary');
    const maxSalaryElem = document.getElementById('max-salary');
    const averageSalaryElem = document.getElementById('average-salary');
    const medianSalaryElem = document.getElementById('median-salary');

    const resetButton = document.getElementById('reset-filters'); // Get reset button

    const table = document.getElementById("job-listings-table");
    const headers = table.querySelectorAll("th");

    headers.forEach((header, index) => {
        header.addEventListener("click", () => {
            sortTable(index);
        });
    });

    // Fetch job data from JSON
    fetch('jobs.json')
        .then(response => response.json())
        .then(jobs => {
            populateFilters(jobs);
            filterJobs(jobs);

            // Add event listeners for filtering
            titleFilter.addEventListener("input", () => filterJobs(jobs));
            companyFilter.addEventListener("input", () => filterJobs(jobs));
            locationFilter.addEventListener("input", () => filterJobs(jobs));
            salaryFilter.addEventListener("input", () => filterJobs(jobs));
            maxSalaryFilter.addEventListener("input", () => filterJobs(jobs));
            jobTypeFilter.addEventListener("change", () => filterJobs(jobs));
            experienceFilter.addEventListener("change", () => filterJobs(jobs));
            employmentTypeFilter.addEventListener("change", () => filterJobs(jobs));
            workArrangementFilter.addEventListener("change", () => filterJobs(jobs));
            dateFilter.addEventListener("change", () => filterJobs(jobs));

            // Add event listener for reset button
            resetButton.addEventListener('click', () => {
                titleFilter.value = '';
                companyFilter.value = '';
                locationFilter.value = '';
                salaryFilter.value = '';
                jobTypeFilter.value = '';
                experienceFilter.value = '';
                employmentTypeFilter.value = '';
                workArrangementFilter.value = '';
                dateFilter.value = '';

                // Re-display all jobs and reset salary stats and histogram
                filterJobs(jobs);
            });
        });

    // Populate filter options based on unique attributes in job data
    function populateFilters(jobs) {
        const jobTypes = new Set();
        const experienceLevels = new Set();
        const employmentTypes = new Set();
        const workArrangements = new Set();

        jobs.forEach(job => {
            jobTypes.add(job.job_type);
            experienceLevels.add(job.experience_level);
            employmentTypes.add(job.employment_type);
            workArrangements.add(job.work_arrangement);
        });

        populateDropdown(jobTypeFilter, jobTypes);
        populateDropdown(experienceFilter, experienceLevels);
        populateDropdown(employmentTypeFilter, employmentTypes);
        populateDropdown(workArrangementFilter, workArrangements);
    }

    function populateDropdown(dropdown, items) {
        // Convert Set to Array, sort alphabetically, then add to dropdown
        Array.from(items)
            .sort((a, b) => a.localeCompare(b))
            .forEach(item => {
                const option = document.createElement("option");
                option.value = item;
                option.textContent = item;
                dropdown.appendChild(option);
            });
    }

    // Function to format the date to YYYY-MM-DD
    function formatDate(date) {
        const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
        return new Date(date).toLocaleDateString('en-CA', options); // 'en-CA' gives format YYYY-MM-DD
    }

    
    function displayJobs(jobs) {
        jobListings.innerHTML = '';  // Clear existing jobs
        jobs.forEach(job => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><a href="${job.link}" target="_blank" class="job-link">${job.job_title}</a></td>
                <td>${job.company}</td>
                <td>${job.location}</td>
                <td>${job.salary}</td>
                <td>${job.job_type}</td>
                <td>${job.experience_level}</td>
                <td>${job.employment_type}</td>
                <td>${job.work_arrangement}</td>
                <td>${formatDate(job.date_posted)}</td>
            `;
            jobListings.appendChild(row);
        });
    }

    function calculateSalaryStats(jobs) {
        const salaries = jobs
            .map(job => parseFloat(job.salary))
            .filter(salary => !isNaN(salary));

        if (salaries.length > 0) {
            const minSalary = (Math.min(...salaries)/1000).toFixed(0);
            const maxSalary = (Math.max(...salaries)/1000).toFixed(0);
            const averageSalary = ((salaries.reduce((acc, curr) => acc + curr, 0) / salaries.length)/1000).toFixed(0);
            const medianSalary = (calculateMedian(salaries)/1000).toFixed(0);

            minSalaryElem.textContent = `$${minSalary}k`;
            maxSalaryElem.textContent = `$${maxSalary}k`;
            averageSalaryElem.textContent = `$${averageSalary}k`;
            medianSalaryElem.textContent = `$${medianSalary}k`;
        }
    }

    function calculateMedian(values) {
        values.sort((a, b) => a - b);
        const middle = Math.floor(values.length / 2);
        return values.length % 2 !== 0 ? values[middle] : ((values[middle - 1] + values[middle]) / 2).toFixed(2);
    }

    function createSalaryHistogram(jobData) {
        const salaries = jobData.map(job => job.salary).filter(salary => salary !== null && salary !== 'null');
    
        // Convert salaries to numbers and filter out non-numeric values
        const salaryNumbers = salaries.map(salary => parseFloat(salary.replace(/[^0-9.-]+/g, "")) / 1000).filter(num => !isNaN(num));
    
        if (salaryNumbers.length === 0) {
            console.log("No valid salaries found to create a histogram.");
            return; // Early exit if there are no valid salaries
        }
    
        // Determine the min and max salaries
        const maxSalary = Math.max(...salaryNumbers);
        const minSalary = 0;
    
        let binCount = Math.max(10,Math.min(salaryNumbers.length, 30)); // You can adjust this to have more or fewer bins
        const binSize = (maxSalary - minSalary) / binCount;
    
        // Create bins, including the upper limit of the last bin
        const bins = Array.from({ length: binCount + 1 }, (_, i) => minSalary + i * binSize);
        
        // Ensure the last bin goes all the way to maxSalary
        bins[bins.length - 1] = maxSalary; 
    
        // Initialize histogram data
        const histogramData = new Array(binCount).fill(0);
    
        // Distribute salaries into bins
        salaryNumbers.forEach(salary => {
            for (let i = 0; i < bins.length - 1; i++) {
                if (salary >= bins[i] && salary < bins[i + 1]) {
                    histogramData[i]++;
                    return; // Stop after placing the salary in the right bin
                }
            }
            // Handle case where salary is equal to max salary
            if (salary === maxSalary) {
                histogramData[histogramData.length - 1]++;
            }
        });
    
        // Destroy the previous chart instance if it exists
        if (salaryChart) {
            salaryChart.destroy();
        }
    
        // Create the histogram chart
        const ctx = document.getElementById('salaryHistogram').getContext('2d');
        salaryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: bins.slice(0, -1).map((bin, index) =>
                    `${bin.toFixed(0)}k - ${bins[index + 1].toFixed(0)}k`
                ),
                datasets: [{
                    label: 'Number of Jobs',
                    data: histogramData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: false,
                            text: 'Salary Ranges'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Jobs'
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Remove the legend
                    }
                }
            }
        });
    }


    function sortTable(columnIndex, toggle = true) {
        const tbody = table.querySelector("tbody");
        const rows = Array.from(tbody.querySelectorAll("tr"));
    
        // Determine the new sort order
        if (toggle)
            currentSortOrder = tbody.dataset.sortOrder === "asc" ? "desc" : "asc";
        tbody.dataset.sortOrder = currentSortOrder; // Update to the new sort order
        currentSortColumnIndex = columnIndex; // Update the current sort column index
    
        const isNumericColumn = columnIndex === 3; // Salary column index
        const isDateColumn = columnIndex === 8; // Date Posted column index
    
        // Sort the rows based on the column index
        rows.sort((rowA, rowB) => {
            const cellA = rowA.cells[columnIndex].innerText || "0"; // Fallback to "0" for empty cells
            const cellB = rowB.cells[columnIndex].innerText || "0";
    
            if (isNumericColumn) {
                const numA = parseFloat(cellA.replace(/[^0-9.-]+/g, '')) || 0; // Convert to number, treat non-numeric as 0
                const numB = parseFloat(cellB.replace(/[^0-9.-]+/g, '')) || 0;
                return currentSortOrder === "asc" ? numA - numB : numB - numA;
            } else if (isDateColumn) {
                const dateA = new Date(cellA);
                const dateB = new Date(cellB);
                return currentSortOrder === "asc" ? dateA - dateB : dateB - dateA;
            } else {
                return currentSortOrder === "asc" ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
            }
        });
    
        // Append sorted rows back to the tbody
        rows.forEach(row => tbody.appendChild(row));
    
        // Clear existing arrows from all headers
        const arrows = table.querySelectorAll(".sort-arrow");
        arrows.forEach(arrow => arrow.innerHTML = ''); // Clear all arrows
    
        // Add arrow to the currently sorted column
        const currentArrow = table.querySelector(`th:nth-child(${columnIndex + 1}) .sort-arrow`);
        currentArrow.innerHTML = currentSortOrder === "asc" ? " &#x25B2;" : " &#x25BC;"; // Add current sort arrow
    }
    

    
    
    
    

    function filterJobs(jobs) {
        const titleValue = titleFilter.value.toLowerCase();
        const companyValue = companyFilter.value.toLowerCase();
        const locationValue = locationFilter.value.toLowerCase();
        const salaryValue = salaryFilter.value ? parseFloat(salaryFilter.value) : null;
        const maxSalaryValue = maxSalaryFilter.value ? parseFloat(maxSalaryFilter.value) : null;
        const jobTypeValue = jobTypeFilter.value;
        const experienceValue = experienceFilter.value;
        const employmentTypeValue = employmentTypeFilter.value;
        const workArrangementValue = workArrangementFilter.value;
        const daysAgo = dateFilter.value ? parseInt(dateFilter.value) : null;
        const now = new Date();
    
        const filteredJobs = jobs.filter(job => {
            // Parse job date to calculate the days difference
            const jobDate = new Date(job.date_posted);
            const daysDifference = (now - jobDate) / (1000 * 60 * 60 * 24);
    
            const matchesTitle = job.job_title.toLowerCase().includes(titleValue);
            const matchesCompany = job.company.toLowerCase().includes(companyValue);
            const matchesLocation = job.location.toLowerCase().includes(locationValue);
            const matchesJobType = !jobTypeValue || job.job_type === jobTypeValue;
            const matchesExperience = !experienceValue || job.experience_level === experienceValue;
            const matchesEmploymentType = !employmentTypeValue || job.employment_type === employmentTypeValue;
            const matchesWorkArrangement = !workArrangementValue || job.work_arrangement === workArrangementValue;
            const matchesMinSalary = !salaryValue || job.salary >= salaryValue;
            const matchesMaxSalary = !maxSalaryValue || job.salary <= maxSalaryValue;
    
            // Match jobs within the selected date range or show all if no range is selected
            const matchesDate = !daysAgo || daysDifference <= daysAgo;
    
            return matchesTitle && matchesCompany && matchesLocation &&
                   matchesMinSalary && matchesMaxSalary && matchesJobType &&
                   matchesExperience && matchesEmploymentType &&
                   matchesWorkArrangement && matchesDate;
        });
    
        // Update display and stats with filtered results
        displayJobs(filteredJobs);
        calculateSalaryStats(filteredJobs);
        createSalaryHistogram(filteredJobs);

        const jobCountElem = document.getElementById('job-count');
        jobCountElem.textContent = `Showing ${filteredJobs.length} of ${jobs.length} jobs`;

        // Reapply sorting if there was a previous sort action
        if (currentSortColumnIndex !== null) 
            sortTable(currentSortColumnIndex, false);
    }
    
});
