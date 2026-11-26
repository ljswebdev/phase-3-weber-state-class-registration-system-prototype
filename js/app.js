// Sample class data used for the search results
const classes = [
  { crn: "30100", subject: "CS", number: "1400", title: "Programming I", section: "001", days: "MWF", start: "10:30 AM", end: "11:50 AM", credits: 4, instructor: "Yong Zhang", campus: "Main" },
  { crn: "30200", subject: "MATH", number: "1010", title: "College Algebra", section: "002", days: "TR", start: "11:30 AM", end: "12:50 PM", credits: 3, instructor: "Sam Smith", campus: "Davis" },
  { crn: "30300", subject: "ENGL", number: "2010", title: "Intermediate Writing", section: "003", days: "MWF", start: "9:00 AM", end: "10:15 AM", credits: 3, instructor: "Robert Hunt", campus: "Main" },
];

// Loading spinner shown inside buttons while something is "processing"
const spinner = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> ';

// Classes the student has added (resets whenever the page is reloaded or closed)
let cart = [];

// The results table body (only on the results page)
let resultsBody = document.getElementById("results-body");

// Show the term picked on the Select a Term page (defaults to Spring 2027)
let term = new URLSearchParams(window.location.search).get("term") || "Spring 2027";
for (let span of document.querySelectorAll(".term-name")) {
  span.textContent = term;
}

// Looks up a class in the data by its CRN
function findClass(crn) {
  return classes.find(c => c.crn === crn);
}

// Shows a Bootstrap alert in the given message area 
function showMessage(id, text, type) {
  let box = document.getElementById(id);
  if (!box) {
    return;
  }
  box.className = "alert alert-" + type + " mt-3";
  box.textContent = text;
}

// Rebuilds the summary list, credit total and weekly calendar from the cart
function showSchedule() {
  let list = document.getElementById("summary-list");
  let row = document.getElementById("calendar-row");
  let total = 0;

  list.innerHTML = "";
  if (cart.length === 0) {
    list.innerHTML = '<li class="py-2 text-muted">No classes added yet.</li>';
  }

  for (let item of cart) {
    let c = findClass(item.crn);
    total = total + c.credits;

    let badge = '<span class="badge text-bg-warning">Pending</span>';
    let removeButton = '<button type="button" class="btn btn-outline-secondary remove-btn" data-crn="' + c.crn + '" aria-label="Remove ' + c.subject + ' ' + c.number + ' ' + c.title + '">X</button>';
    if (item.registered) {
      badge = '<span class="badge text-bg-success">Registered</span>';
      removeButton = "";
    }

    list.innerHTML +=
      '<li class="d-flex justify-content-between align-items-center gap-2 py-2 border-bottom">' +
      '<div><strong>' + c.subject + ' ' + c.number + '</strong> ' + c.title +
      '<br><span class="small text-muted">' + c.days + ' ' + c.start + ' - ' + c.end + ', ' + c.credits + ' credits</span></div>' +
      '<div class="d-flex align-items-center gap-2">' + badge + removeButton + '</div>' +
      '</li>';
  }

  document.getElementById("total-credits").textContent = total;

  row.innerHTML = "";
  for (let day of ["M", "T", "W", "R", "F"]) {
    let cell = "";
    for (let item of cart) {
      let c = findClass(item.crn);
      if (c.days.includes(day)) {
        let extra = item.registered ? " registered" : "";
        cell += '<div class="class-block' + extra + '"><strong>' + c.subject + ' ' + c.number + '</strong><br>' + c.start + ' - ' + c.end + '</div>';
      }
    }
    if (cell === "") {
      cell = '<span class="small text-muted">No classes</span>';
    }
    row.innerHTML += "<td>" + cell + "</td>";
  }

  let hasPending = cart.some(item => !item.registered);
  document.getElementById("submit-registration").disabled = !hasPending;
}

// Switches each result's button between "Add" and "Added"
function updateAddButtons() {
  for (let button of document.querySelectorAll(".add-btn")) {
    let c = findClass(button.dataset.crn);
    let added = cart.some(item => item.crn === c.crn);
    if (added) {
      button.className = "btn btn-success add-btn";
      button.textContent = "Added";
      button.setAttribute("aria-disabled", "true");
      button.setAttribute("aria-label", "Added: " + c.subject + " " + c.number + " " + c.title);
    } else {
      button.className = "btn btn-primary add-btn";
      button.textContent = "Add";
      button.setAttribute("aria-disabled", "false");
      button.setAttribute("aria-label", "Add " + c.subject + " " + c.number + " " + c.title);
    }
  }
}

// Schedule panel (search and results pages)
let summaryList = document.getElementById("summary-list");

if (summaryList) {
  // Draw the schedule when the page first loads
  showSchedule();

  // Remove a pending class when its X button is clicked
  summaryList.addEventListener("click", function (e) {
    let button = e.target.closest(".remove-btn");
    if (!button) {
      return;
    }
    let c = findClass(button.dataset.crn);
    cart = cart.filter(item => item.crn !== c.crn);
    showSchedule();
    updateAddButtons();
    document.getElementById("summary-heading").focus();
    showMessage("schedule-status", c.subject + " " + c.number + " was removed from your schedule.", "info");
  });

  // Submit: shows a spinner, then marks every class as registered
  document.getElementById("submit-registration").addEventListener("click", function () {
    let button = this;
    button.disabled = true;
    button.innerHTML = spinner + "Submitting...";

    setTimeout(function () {
      for (let item of cart) {
        item.registered = true;
      }
      button.innerHTML = "Submit";
      showSchedule();
      updateAddButtons();
      showMessage("schedule-status", "Registration submitted! You are registered for " + cart.length + " classes.", "success");
    }, 1200);
  });
}

// Search form (on both pages)
let searchForm = document.getElementById("class-search");

if (searchForm) {
  let subject = document.getElementById("subject");
  let keyword = document.getElementById("keyword");
  let number = document.getElementById("course-number");
  let error = document.getElementById("search-error");
  let searchButton = document.getElementById("search-btn");

  // Fill the form back in with the last search
  let params = new URLSearchParams(window.location.search);
  for (let field of searchForm.elements) {
    if (field.name && params.has(field.name)) {
      field.value = params.get(field.name);
    }
  }

  // Hides the "enter a subject or keyword" error
  function clearError() {
    error.hidden = true;
    subject.classList.remove("is-invalid");
    keyword.classList.remove("is-invalid");
    subject.removeAttribute("aria-invalid");
    keyword.removeAttribute("aria-invalid");
  }

  // Checks the course number is blank or exactly 4 digits and shows valid/invalid
  function checkNumber() {
    if (number.value === "") {
      number.classList.remove("is-valid", "is-invalid");
      number.removeAttribute("aria-invalid");
      return true;
    }
    if (/^\d{4}$/.test(number.value)) {
      number.classList.add("is-valid");
      number.classList.remove("is-invalid");
      number.removeAttribute("aria-invalid");
      return true;
    }
    number.classList.add("is-invalid");
    number.classList.remove("is-valid");
    number.setAttribute("aria-invalid", "true");
    return false;
  }

  subject.addEventListener("change", clearError);
  keyword.addEventListener("input", clearError);
  number.addEventListener("blur", checkNumber);

  // Clear button also clears any error styling
  searchForm.addEventListener("reset", function () {
    clearError();
    number.classList.remove("is-valid", "is-invalid");
    number.removeAttribute("aria-invalid");
  });

  // Validates the form, shows a spinner and runs a search
  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();

    if (subject.value === "" && keyword.value.trim() === "") {
      error.hidden = false;
      subject.classList.add("is-invalid");
      keyword.classList.add("is-invalid");
      subject.setAttribute("aria-invalid", "true");
      keyword.setAttribute("aria-invalid", "true");
      subject.focus();
      return;
    }

    if (!checkNumber()) {
      number.focus();
      return;
    }

    searchButton.disabled = true;
    searchButton.innerHTML = spinner + "Searching...";
    setTimeout(function () {
      if (resultsBody) {
        showResults();
        searchButton.disabled = false;
        searchButton.innerHTML = "Search";
      } else {
        searchForm.submit();
      }
    }, 800);
  });
}

// Builds the results table from whatever is in the search form
function showResults() {
  let subject = document.getElementById("subject").value;
  let number = document.getElementById("course-number").value.trim();
  let keyword = document.getElementById("keyword").value.trim().toLowerCase();
  let campus = document.getElementById("campus").value;

  // Keep only the classes that match the search
  let results = classes.filter(function (c) {
    return (subject === "" || c.subject === subject) &&
      (number === "" || c.number.startsWith(number)) &&
      (keyword === "" || c.title.toLowerCase().includes(keyword)) &&
      (campus === "" || c.campus === campus);
  });

  if (results.length === 1) {
    document.getElementById("results-summary").textContent = "1 class found.";
  } else {
    document.getElementById("results-summary").textContent = results.length + " classes found.";
  }

  resultsBody.innerHTML = "";
  if (results.length === 0) {
    resultsBody.innerHTML = '<tr><td colspan="7">No classes found. Try a different search.</td></tr>';
  }

  // Add a table row for each matching class
  for (let c of results) {
    resultsBody.innerHTML +=
      '<tr>' +
      '<th scope="row">' + c.subject + ' ' + c.number +
      '<span class="d-block d-md-none fw-normal">' + c.title + ', ' + c.credits + ' credits</span>' +
      '<span class="d-block small fw-normal text-muted">Section ' + c.section + ', CRN ' + c.crn + '</span></th>' +
      '<td class="d-none d-md-table-cell">' + c.title + '</td>' +
      '<td>' + c.days + '<span class="d-block small text-muted">' + c.start + ' - ' + c.end + '</span></td>' +
      '<td class="d-none d-md-table-cell">' + c.instructor + '</td>' +
      '<td class="d-none d-md-table-cell">' + c.campus + '</td>' +
      '<td class="d-none d-md-table-cell">' + c.credits + '</td>' +
      '<td><button type="button" class="btn btn-primary add-btn" data-crn="' + c.crn + '">Add</button></td>' +
      '</tr>';
  }

  updateAddButtons();
}

// Search results (results page only)
if (resultsBody) {
  showResults();

  // Add a class to the schedule when its Add button is clicked
  resultsBody.addEventListener("click", function (e) {
    let button = e.target.closest(".add-btn");
    if (!button || button.getAttribute("aria-disabled") === "true") {
      return;
    }

    let c = findClass(button.dataset.crn);
    cart.push({ crn: c.crn, registered: false });
    updateAddButtons();
    showSchedule();
    showMessage("results-status", c.subject + " " + c.number + " was added to your schedule. Click Submit to register.", "success");
  });
}