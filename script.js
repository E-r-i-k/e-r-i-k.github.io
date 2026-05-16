let salaryChart; // Variable to hold the chart instance
let weeklyAverageSalaryChart; // New variable for the weekly average chart
let jobTypeChart; // Chart for job type distribution
let allJobs = []; // Make allJobs accessible globally
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
    const listedPctElem = document.getElementById('listed-pct');

    const resetButton = document.getElementById('reset-filters'); // Get reset button
    const showWeeklyAverageSalaryBtn = document.getElementById('show-weekly-average-salary-btn'); // Get the new button

    const table = document.getElementById("job-listings-table");
    const headers = table.querySelectorAll("th");
    const scrollToBottomBtn = document.getElementById('scroll-to-bottom-btn');

    let chartView = 'histogram';
    // Initially hide non-histogram charts
    document.getElementById('weeklyAverageSalaryChart').style.display = 'none';
    document.getElementById('jobTypeChart').style.display = 'none';

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
        const windowHeight = window.innerHeight;  // Height of the viewport (screen)

        // Show the button if the table is near the bottom of the screen
        if (currentDisplayIndex !== filteredJobs.length && tableBottom >= windowHeight + 200) {
            scrollToBottomBtn.style.display = 'block';  // Show the button
        } else {
            scrollToBottomBtn.style.display = 'none';  // Hide the button
        }
    };
    
    // Scroll to the bottom when the button is clicked
    scrollToBottomBtn.addEventListener('click', function() {
        currentDisplayIndex = filteredJobs.length;
        displayJobs(filteredJobs);
        scrollToBottomBtn.style.display = 'none';  // Hide the button
        window.scrollTo({
            top: document.body.scrollHeight,  // Scroll to the bottom of the page
            behavior: 'smooth'  // Smooth scrolling effect
        });
    });
    

    // Fetch job data from JSON
    fetch('jobs.json')
        .then(response => response.json())
        .then(jobs => {
            // Normalize data on load
            allJobs = jobs.map(job => {
                const newJob = { ...job };
                // Normalize employment_type
                if (newJob.employment_type) {
                    newJob.employment_type = newJob.employment_type.toLowerCase();
                    if (newJob.employment_type.toLowerCase().includes('temp'))
                        newJob.employment_type = 'contract';
                    if (newJob.employment_type.toLowerCase().includes('casual'))
                        newJob.employment_type = 'casual';
                }
                // Normalize work_arrangement to lowercase for consistency
                if (newJob.work_arrangement) {
                    newJob.work_arrangement = newJob.work_arrangement.toLowerCase();
                }
                return newJob;
            });

            populateFilters(allJobs);
            filterJobs(allJobs);
            
            // Add event listener for the chart toggle button (3-state cycle)
            showWeeklyAverageSalaryBtn.addEventListener('click', () => {
                const salaryHistogramCanvas = document.getElementById('salaryHistogram');
                const weeklyAverageSalaryChartCanvas = document.getElementById('weeklyAverageSalaryChart');
                const jobTypeChartCanvas = document.getElementById('jobTypeChart');
                const chartTitleElem = document.getElementById('chart-title');

                if (chartView === 'histogram') {
                    chartView = 'weekly';
                    salaryHistogramCanvas.style.display = 'none';
                    weeklyAverageSalaryChartCanvas.style.display = 'block';
                    jobTypeChartCanvas.style.display = 'none';
                    showWeeklyAverageSalaryBtn.textContent = 'Show Job Types';
                    chartTitleElem.textContent = 'Weekly Average Salary';
                    createWeeklyAverageSalaryChart(filteredJobs);
                } else if (chartView === 'weekly') {
                    chartView = 'jobtype';
                    salaryHistogramCanvas.style.display = 'none';
                    weeklyAverageSalaryChartCanvas.style.display = 'none';
                    jobTypeChartCanvas.style.display = 'block';
                    showWeeklyAverageSalaryBtn.textContent = 'Show Salary Histogram';
                    chartTitleElem.textContent = 'Jobs by Type';
                    createJobTypeChart(filteredJobs);
                } else {
                    chartView = 'histogram';
                    salaryHistogramCanvas.style.display = 'block';
                    weeklyAverageSalaryChartCanvas.style.display = 'none';
                    jobTypeChartCanvas.style.display = 'none';
                    showWeeklyAverageSalaryBtn.textContent = 'Show Weekly Average Salary';
                    chartTitleElem.textContent = 'Salary Distribution';
                    createSalaryHistogram(filteredJobs);
                }
            });

            // Add event listeners for filtering
            titleFilter.addEventListener("input", debounce(() => filterJobs(jobs)));
            companyFilter.addEventListener("input", debounce(() => filterJobs(jobs)));
            locationFilter.addEventListener("input", debounce(() => filterJobs(jobs)));
            salaryFilter.addEventListener("input", debounce(() => filterJobs(jobs)));
            maxSalaryFilter.addEventListener("input", debounce(() => filterJobs(jobs)));
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
                maxSalaryFilter.value = ''; // Reset max salary filter
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
                <td>${job.salary !== null && !isNaN(job.salary) ? (job.is_estimated_salary ? '<span class="badge badge-est">Est.</span>' : '<span class="badge badge-listed">Listed</span>') : ''}</td>
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
        } else {
            minSalaryElem.textContent = 'N/A';
            maxSalaryElem.textContent = 'N/A';
            averageSalaryElem.textContent = 'N/A';
            medianSalaryElem.textContent = 'N/A';
        }

        const listedCount = jobs.filter(j => j.salary !== null && !isNaN(parseFloat(j.salary)) && !j.is_estimated_salary).length;
        const pct = jobs.length ? Math.round(listedCount / jobs.length * 100) : 0;
        listedPctElem.textContent = `${listedCount} (${pct}%)`;
    }

    function calculateMedian(values) {
        values.sort((a, b) => a - b);
        const middle = Math.floor(values.length / 2);
        return values.length % 2 !== 0 ? values[middle] : ((values[middle - 1] + values[middle]) / 2);
    }

    function createSalaryHistogram(jobData) {
        const toK = arr => arr.map(job => job.salary / 1000).filter(num => !isNaN(num));
        const listedJobs = jobData.filter(job => job.salary !== null && job.salary !== 'null' && !job.is_estimated_salary);
        const estimatedJobs = jobData.filter(job => job.salary !== null && job.salary !== 'null' && job.is_estimated_salary);
        const listedK = toK(listedJobs);
        const estimatedK = toK(estimatedJobs);
        const allK = [...listedK, ...estimatedK];

        if (!allK.length) {
            if (salaryChart) { salaryChart.destroy(); salaryChart = null; }
            return;
        }

        const maxSalary = Math.max(...allK);
        const binCount = Math.max(10, Math.min(allK.length, 30));
        const binSize = maxSalary / binCount;
        const bins = Array.from({ length: binCount + 1 }, (_, i) => i * binSize);
        bins[bins.length - 1] = maxSalary;

        const makeBins = (salaries) => {
            const data = new Array(binCount).fill(0);
            salaries.forEach(salary => {
                for (let i = 0; i < bins.length - 1; i++) {
                    if (salary >= bins[i] && (i === bins.length - 2 ? salary <= bins[i + 1] : salary < bins[i + 1])) {
                        data[i]++;
                        return;
                    }
                }
            });
            return data;
        };

        const listedData = makeBins(listedK);
        const estimatedData = makeBins(estimatedK);
        const labels = bins.slice(0, -1).map((bin, i) =>
            `${bin.toFixed(0)}k – ${bins[i + 1].toFixed(0)}k`
        );

        if (!salaryChart) {
            const ctx = document.getElementById('salaryHistogram').getContext('2d');
            salaryChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Listed',
                            data: listedData,
                            backgroundColor: 'rgba(45, 212, 191, 0.65)',
                            borderColor: 'rgba(45, 212, 191, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Estimated',
                            data: estimatedData,
                            backgroundColor: 'rgba(251, 191, 36, 0.55)',
                            borderColor: 'rgba(251, 191, 36, 0.9)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    scales: {
                        x: {
                            stacked: true,
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#e0e0e0' },
                            title: { display: true, text: 'Salary Range', color: '#e0e0e0' }
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#e0e0e0' },
                            title: { display: true, text: 'Number of Jobs', color: '#e0e0e0' }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            labels: { color: '#e0e0e0', usePointStyle: true }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.raw}`;
                                }
                            }
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        } else {
            salaryChart.data.labels = labels;
            salaryChart.data.datasets[0].data = listedData;
            salaryChart.data.datasets[1].data = estimatedData;
            salaryChart.update();
        }
    }


    function createWeeklyAverageSalaryChart(jobData, windowSize = 3) { // Added windowSize parameter
        // Group salaries by week
        const weeklySalaries = {};
        jobData.forEach(job => {
            const date = new Date(job.date_posted);
            if (isNaN(date) || job.salary === null || isNaN(parseFloat(job.salary))) return; // Skip invalid dates or salaries
    
            // Get the start of the week (Monday)
            const dayOfWeek = (date.getDay() + 6) % 7; // Adjust to make Monday=0, Sunday=6
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - dayOfWeek);
            startOfWeek.setHours(0, 0, 0, 0); // Set to start of the day
    
            const weekKey = startOfWeek.toISOString().split('T')[0]; // Format as YYYY-MM-DD for week start
    
            const salary = parseFloat(job.salary);
            if (!weeklySalaries[weekKey]) {
                weeklySalaries[weekKey] = [];
            }
            weeklySalaries[weekKey].push(salary);
        });
    
        // Get all unique week keys and sort them chronologically
        const allWeekKeys = Object.keys(weeklySalaries);
        if (allWeekKeys.length === 0) {
            if (weeklyAverageSalaryChart) {
                weeklyAverageSalaryChart.destroy();
                weeklyAverageSalaryChart = null;
            }
            return;
        }
    
        const minDate = new Date(Math.min(...allWeekKeys.map(key => new Date(key))));
        const maxDate = new Date(Math.max(...allWeekKeys.map(key => new Date(key))));
    
        const labels = [];
        const rawAverages = []; // Store raw weekly averages for moving average calculation
        let currentDate = new Date(minDate);
        let lastAverage = 0; // Stores the last calculated average salary
    
        while (currentDate <= maxDate) {
            const weekKey = currentDate.toISOString().split('T')[0];
            labels.push(weekKey);
    
            if (weeklySalaries[weekKey] && weeklySalaries[weekKey].length > 0) {
                const salariesInWeek = weeklySalaries[weekKey];
                const average = salariesInWeek.reduce((sum, s) => sum + s, 0) / salariesInWeek.length;
                rawAverages.push(average);
                lastAverage = average;
            } else {
                rawAverages.push(lastAverage); // Use the last average if no data for the current week
            }
    
            // Move to the next week (add 7 days)
            currentDate.setDate(currentDate.getDate() + 7);
        }
    
        // Calculate the moving average
        const smoothedData = [];
        for (let i = 0; i < rawAverages.length; i++) {
            const startIndex = Math.max(0, i - Math.floor(windowSize / 2));
            const endIndex = Math.min(rawAverages.length - 1, i + Math.ceil(windowSize / 2) -1); // Adjusted for centering
            
            let sum = 0;
            let count = 0;
            for (let j = startIndex; j <= endIndex; j++) {
                // Only include non-zero (meaning actual data or carried forward) averages
                if (rawAverages[j] > 0) {
                    sum += rawAverages[j];
                    count++;
                }
            }
            if (count > 0) {
                smoothedData.push((sum / count) / 1000); // Convert to 'k'
            } else {
                smoothedData.push(0); // If no data in window, push 0 or handle as appropriate
            }
        }
        
        // Create or update the chart
        if (!weeklyAverageSalaryChart) {
            const ctx = document.getElementById('weeklyAverageSalaryChart').getContext('2d');
            weeklyAverageSalaryChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: `Average Salary (k) - ${windowSize}-week Moving Average`, // Updated label
                        data: smoothedData,
                        borderColor: '#7dfff2',
                        backgroundColor: '#03dac6',
                        fill: false,
                        tension: 0.1
                    }]
                },
                options: {
                    scales: {
                        x: {
                            beginAtZero: false,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#e0e0e0' },
                            title: { display: true, text: 'Week Start Date', color: '#e0e0e0' }
                        },
                        y: {
                            beginAtZero: false,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#e0e0e0' },
                            title: { display: true, text: 'Average Salary (k)', color: '#e0e0e0' }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Avg. Salary: $${context.raw.toFixed(0)}k`;
                                }
                            }
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        } else {
            weeklyAverageSalaryChart.data.labels = labels;
            weeklyAverageSalaryChart.data.datasets[0].data = smoothedData;
            weeklyAverageSalaryChart.data.datasets[0].label = `Average Salary (k) - ${windowSize}-week Moving Average`;
            weeklyAverageSalaryChart.update();
        }
    }


    function createJobTypeChart(jobData) {
        const counts = {};
        jobData.forEach(job => {
            const t = job.job_type || 'unknown';
            counts[t] = (counts[t] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const labels = sorted.map(([k]) => k);
        const data = sorted.map(([, v]) => v);
        const palette = [
            'rgba(45, 212, 191, 0.7)', 'rgba(124, 58, 237, 0.7)',
            'rgba(251, 191, 36, 0.7)', 'rgba(59, 130, 246, 0.7)',
            'rgba(239, 68, 68, 0.7)',  'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)', 'rgba(99, 102, 241, 0.7)'
        ];
        const colors = labels.map((_, i) => palette[i % palette.length]);

        if (!jobTypeChart) {
            const ctx = document.getElementById('jobTypeChart').getContext('2d');
            jobTypeChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Jobs',
                        data,
                        backgroundColor: colors,
                        borderColor: colors.map(c => c.replace('0.7', '1')),
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y',
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#e0e0e0' },
                            title: { display: true, text: 'Number of Jobs', color: '#e0e0e0' }
                        },
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#e0e0e0' }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: ctx => `Jobs: ${ctx.raw}`
                            }
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        } else {
            jobTypeChart.data.labels = labels;
            jobTypeChart.data.datasets[0].data = data;
            jobTypeChart.data.datasets[0].backgroundColor = colors;
            jobTypeChart.update();
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
        arrows.forEach(arrow => arrow.innerHTML = '');  // Clear existing arrows
    
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
                (!salaryValue || (job.salary !== null && !isNaN(job.salary) && parseFloat(job.salary) >= salaryValue)) &&
                (!maxSalaryValue || (job.salary !== null && !isNaN(job.salary) && parseFloat(job.salary) <= maxSalaryValue)) &&
                (!jobTypeValue || job.job_type === jobTypeValue) &&
                (!experienceValue || job.experience_level === experienceValue) &&
                (!employmentTypeValue || job.employment_type === employmentTypeValue) &&
                (!workArrangementValue || job.work_arrangement === workArrangementValue) &&
                (salaryEstimateValue === job.is_estimated_salary || !job.is_estimated_salary) &&
                (!daysAgo || daysDifference <= daysAgo);
        });

        // Reapply the current sort if one was applied
        if (currentSortColumnIndex !== null) {
            filteredJobs.sort((a, b) => compareJobs(a, b, currentSortColumnIndex));
            if (currentSortOrder === 'desc') filteredJobs.reverse();
        }

        // Reset pagination and display filtered jobs
        currentDisplayIndex = 0;
        displayJobs(filteredJobs.slice(currentDisplayIndex, currentDisplayIndex + jobsPerPage));

        // Calculate salary stats and update histogram
        calculateSalaryStats(filteredJobs);
        
        // Update active chart
        if (chartView === 'histogram') {
            createSalaryHistogram(filteredJobs);
        } else if (chartView === 'weekly') {
            createWeeklyAverageSalaryChart(filteredJobs);
        } else if (chartView === 'jobtype') {
            createJobTypeChart(filteredJobs);
        }

        // Update arrangement badges
        const arrangementCounts = {};
        filteredJobs.forEach(job => {
            const arr = job.work_arrangement || 'unknown';
            arrangementCounts[arr] = (arrangementCounts[arr] || 0) + 1;
        });
        const badgesDiv = document.getElementById('arrangement-badges');
        badgesDiv.innerHTML = Object.entries(arrangementCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([arr, count]) => `<span class="arr-badge arr-badge-${arr.replace(/\s+/g, '-')}">${arr}: <strong>${count}</strong></span>`)
            .join('');

        // Update job count
        const jobCountElem = document.getElementById('job-count');
        jobCountElem.textContent = `Showing ${filteredJobs.length} of ${jobs.length} jobs`;
    }
});