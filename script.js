let salaryChart; // Variable to hold the chart instance
let currentSortColumnIndex = null; // Track which column is sorted
let currentSortOrder = 'asc'; // Track current sort order
let filteredJobs = []; // Filtered job list
let currentDisplayIndex = 0;
const jobsPerPage = 50;

document.addEventListener("DOMContentLoaded", () => {
    const jobListings = document.getElementById('job-listings');
    const titleFilter = document.getElementById('title-filter');
    const companyFilter = document.getElementById('company-filter');
    const locationFilter = document.getElementById('location-filter');
    const salaryFilter = document.getElementById('salary-filter');
    const maxSalaryFilter = document.getElementById('max-salary-filter');
    const salaryEstimateFilter = document.getElementById('salary-estimate-filter');
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
    const scrollToBottomBtn = document.getElementById('scroll-to-bottom-btn');


    headers.forEach((header, index) => {
        header.addEventListener("click", () => {
            sortTable(index);
        });
    });

    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
            if (currentDisplayIndex < filteredJobs.length) {
                const nextIndex = Math.min(currentDisplayIndex + jobsPerPage, filteredJobs.length);
                displayJobs(filteredJobs.slice(0, nextIndex));
                currentDisplayIndex = nextIndex;
            }
        }
    });
    
    // Show the button when the user scrolls up 200px from the bottom
    window.onscroll = function() {
        const tableContainer = document.querySelector('.table-container');
        const tableBottom = tableContainer.getBoundingClientRect().bottom; // Bottom of table container
        const windowHeight = window.innerHeight;  // Height of the viewport (screen)

        // Show the button if the table is near the bottom of the screen
        if (tableBottom >= windowHeight + 200) {
            scrollToBottomBtn.style.display = 'block';  // Show the button
        } else {
            scrollToBottomBtn.style.display = 'none';  // Hide the button
        }
    };
    
    // Scroll to the bottom when the button is clicked
    scrollToBottomBtn.addEventListener('click', function() {
        window.scrollTo({
            top: document.body.scrollHeight,  // Scroll to the bottom of the page
            behavior: 'smooth'  // Smooth scrolling effect
        });
    });
    

    // Fetch job data from JSON
    fetch('jobs.json')
        .then(response => response.json())
        .then(jobs => {
            allJobs = jobs;
            populateFilters(jobs);
            filterJobs(jobs);
            

            // Add event listeners for filtering
            titleFilter.addEventListener("input", debounce(() => filterJobs(jobs)));
            companyFilter.addEventListener("input", () =>  debounce(filterJobs(jobs)));
            locationFilter.addEventListener("input", () =>  debounce(filterJobs(jobs)));
            salaryFilter.addEventListener("input",  debounce(() => filterJobs(jobs)));
            maxSalaryFilter.addEventListener("input",  debounce(() => filterJobs(jobs)));
            salaryEstimateFilter.addEventListener("change", () => filterJobs(jobs));
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
                salaryEstimateFilter.checked = true;

                // Re-display all jobs and reset salary stats and histogram
                filterJobs(jobs);
            });
        });

    function debounce(fn, delay = 300) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    }
        

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
        const fragment = document.createDocumentFragment();
        jobListings.innerHTML = ''; // Clear the list before displaying

        jobs.forEach(job => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><a href="${job.link}" target="_blank" class="job-link">${job.job_title}</a></td>
                <td>${job.company}</td>
                <td>${job.location}</td>
                <td>${(job.salary === null || isNaN(job.salary) ? '' : "$" + (job.salary / 1000).toFixed(0) + "k")}</td>
                <td>${job.is_estimated_salary ? '' : '✔'}</td>
                <td>${job.job_type}</td>
                <td>${job.experience_level}</td>
                <td>${job.employment_type}</td>
                <td>${job.work_arrangement}</td>
                <td>${formatDate(job.date_posted)}</td>
            `;
            fragment.appendChild(row);
        });

        jobListings.appendChild(fragment);
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
        
        const salaryNumbers = salaries.map(salary => salary / 1000).filter(num => !isNaN(num));
        if (!salaryNumbers.length) return;
    
        const maxSalary = Math.max(...salaryNumbers);
        const minSalary = 0;
        const binCount = Math.max(10, Math.min(salaryNumbers.length, 30));
        const binSize = (maxSalary - minSalary) / binCount;
        const bins = Array.from({ length: binCount + 1 }, (_, i) => minSalary + i * binSize);
        bins[bins.length - 1] = maxSalary;
    
        const histogramData = new Array(binCount).fill(0);
        salaryNumbers.forEach(salary => {
            for (let i = 0; i < bins.length - 1; i++) {
                if (salary >= bins[i] && salary < bins[i + 1]) {
                    histogramData[i]++;
                    return;
                }
            }
            if (salary === maxSalary) histogramData[binCount - 1]++;
        });
    
        const labels = bins.slice(0, -1).map((bin, i) =>
            `${bin.toFixed(0)}k - ${bins[i + 1].toFixed(0)}k`
        );
    
        // Create or update the chart
        if (!salaryChart) {
            const ctx = document.getElementById('salaryHistogram').getContext('2d');
            salaryChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Number of Jobs',
                        data: histogramData,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: { x: { beginAtZero: true }, y: { beginAtZero: true } },
                    plugins: { legend: { display: false } },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        } else {
            salaryChart.data.labels = labels;
            salaryChart.data.datasets[0].data = histogramData;
            salaryChart.update();
        }
    }


    function sortTable(columnIndex, toggle = true) {
        if (toggle)
            currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    
        currentSortColumnIndex = columnIndex;
    
        // Sort the filtered jobs array
        filteredJobs.sort((a, b) => compareJobs(a, b, columnIndex));
        if (currentSortOrder === 'desc') filteredJobs.reverse();
    
        // Reset the display index to the first page
        currentDisplayIndex = jobsPerPage;
    
        // Display sorted and filtered jobs
        displayJobs(filteredJobs.slice(0, currentDisplayIndex));
    
        // Update arrow indicators
        const arrows = table.querySelectorAll(".sort-arrow");
        arrows.forEach(arrow => arrow.innerHTML = '');  // Clear existing arrows
    
        const currentArrow = table.querySelector(`th:nth-child(${columnIndex + 1}) .sort-arrow`);
        currentArrow.innerHTML = currentSortOrder === "asc" ? " &#x25B2;" : " &#x25BC;"; // Arrow pointing up or down
    }

    function parseSalary(s) {
        if (typeof s === "number") return s;
        if (!s || typeof s !== "string") return 0;
    
        const match = s.replace(/[^0-9\-–]/g, '').split(/[-–]/);
        const low = parseInt(match[0], 10);
        return isNaN(low) ? 0 : low;
    }
    

    function compareJobs(a, b, columnIndex) {
        switch (columnIndex) {
            case 0: return a.job_title.localeCompare(b.job_title);
            case 1: return a.company.localeCompare(b.company);
            case 2: return a.location.localeCompare(b.location);
            case 3: return parseSalary(a.salary) - parseSalary(b.salary);
            case 4: return (a.is_estimated_salary === b.is_estimated_salary) ? 0 : a.is_estimated_salary ? -1 : 1;
            case 5: return a.job_type.localeCompare(b.job_type);
            case 6: return a.experience_level.localeCompare(b.experience_level);
            case 7: return a.employment_type.localeCompare(b.employment_type);
            case 8: return a.work_arrangement.localeCompare(b.work_arrangement);
            case 9: return new Date(a.date_posted) - new Date(b.date_posted);
            default: return 0;
        }
    }

    function filterJobs(jobs) {
        const titleValue = titleFilter.value.toLowerCase();
        const companyValue = companyFilter.value.toLowerCase();
        const locationValue = locationFilter.value.toLowerCase();
        const salaryValue = salaryFilter.value ? parseFloat(salaryFilter.value) : null;
        const maxSalaryValue = maxSalaryFilter.value ? parseFloat(maxSalaryFilter.value) : null;
        const salaryEstimateValue = salaryEstimateFilter.checked ? 1 : 0;
        const jobTypeValue = jobTypeFilter.value;
        const experienceValue = experienceFilter.value;
        const employmentTypeValue = employmentTypeFilter.value;
        const workArrangementValue = workArrangementFilter.value;
        const daysAgo = dateFilter.value ? parseInt(dateFilter.value) : null;
        const now = new Date();

        filteredJobs = jobs.filter(job => {
            const jobDate = new Date(job.date_posted);
            const daysDifference = (now - jobDate) / (1000 * 60 * 60 * 24);

            return job.job_title.toLowerCase().includes(titleValue) &&
                job.company.toLowerCase().includes(companyValue) &&
                job.location.toLowerCase().includes(locationValue) &&
                (!salaryValue || job.salary >= salaryValue) &&
                (!maxSalaryValue || job.salary <= maxSalaryValue) &&
                (!jobTypeValue || job.job_type === jobTypeValue) &&
                (!experienceValue || job.experience_level === experienceValue) &&
                (!employmentTypeValue || job.employment_type === employmentTypeValue) &&
                (!workArrangementValue || job.work_arrangement === workArrangementValue) &&
                (salaryEstimateValue === job.is_estimated_salary || !job.is_estimated_salary) &&
                (!daysAgo || daysDifference <= daysAgo);
        });

        // Reset pagination and display filtered jobs
        currentDisplayIndex = 0;
        displayJobs(filteredJobs.slice(currentDisplayIndex, currentDisplayIndex + jobsPerPage));

        // Calculate salary stats and update histogram
        calculateSalaryStats(filteredJobs);
        createSalaryHistogram(filteredJobs);

        // Update job count
        const jobCountElem = document.getElementById('job-count');
        jobCountElem.textContent = `Showing ${filteredJobs.length} of ${jobs.length} jobs`;
    }
});
