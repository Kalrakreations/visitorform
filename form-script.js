document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('customerForm');
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvmhvHDmRY6fSGwcrld0EXBhadrCYMRbiWOA4I575ciHBYZhZnFFRlGbbbpPksLaOUbQ/exec";
  const popup = document.getElementById('formPopup');

  // Select fields
  const countrySelect = document.getElementById('country');
  const stateSelect = document.getElementById('state');
  const citySelect = document.getElementById('city');

  // "Others" fields
  const otherFields = {
    designation: document.getElementById('designationOther'),
    country: document.getElementById('countryOther'),
    state: document.getElementById('stateOther'),
    city: document.getElementById('cityOther'),
    business: document.getElementById('businessOther')
  };

  // Validation fields
  const nameInput = form.elements['name'];
  const phoneInput = form.elements['phone'];

  // ---------- Static Data ----------
  const countriesData = [
    "India",
    "United Arab Emirates",
    "Saudi Arabia",
    "Qatar",
    "Oman",
    "Kuwait",
    "Bahrain",
    "United States",
    "United Kingdom",
    "Canada",
    "Singapore",
    "Australia"
  ];

  // --------- All Indian States and Cities ---------
  const indiaData = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Anantapur", "Kadapa", "Srikakulam", "Vizianagaram", "Eluru", "Chittoor"],
    "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Tawang", "Pasighat", "Ziro", "Roing", "Bomdila", "Aalo", "Tezu", "Changlang"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tezpur", "Bongaigaon", "Tinsukia", "Karimganj", "Sivasagar", "Goalpara", "Dhubri", "Barpeta"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Arrah", "Begusarai", "Katihar", "Chhapra", "Purnia", "Saharsa", "Samastipur", "Hajipur"],
    "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Bhilai", "Korba", "Rajnandgaon", "Raigarh", "Ambikapur", "Jagdalpur", "Dhamtari", "Mahasamund", "Kanker", "Janjgir"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Curchorem", "Bicholim", "Sanquelim", "Canacona", "Quepem", "Sanguem"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh", "Anand", "Navsari", "Morbi", "Mehsana", "Nadiad"],
    "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Hisar", "Rohtak", "Karnal", "Sonipat", "Yamunanagar", "Panchkula", "Bahadurgarh", "Jind", "Sirsa"],
    "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Kullu", "Hamirpur", "Una", "Chamba", "Bilaspur", "Nahan", "Palampur", "Sundernagar"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih", "Ramgarh", "Dumka", "Phusro", "Chirkunda", "Medininagar", "Chaibasa"],
    "Karnataka": ["Bengaluru", "Mysuru", "Mangalore", "Hubli", "Belagavi", "Kalaburagi", "Davangere", "Ballari", "Tumakuru", "Shivamogga", "Bidar", "Raichur", "Hospet"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Alappuzha", "Palakkad", "Kottayam", "Kannur", "Pathanamthitta", "Malappuram", "Idukki", "Ernakulam"],
    "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa", "Murwara (Katni)", "Khandwa", "Bhind"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Sangli", "Jalgaon", "Akola", "Latur", "Dhule", "Ahmednagar"],
    "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Senapati", "Kakching", "Ukhrul", "Jiribam", "Tamenglong", "Kangpokpi"],
    "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongpoh", "Baghmara", "Williamnagar", "Nongstoin", "Resubelpara", "Mairang"],
    "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib", "Lawngtlai", "Saiha", "Mamit"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Phek", "Mon", "Peren", "Kiphire", "Longleng"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur", "Berhampur", "Balasore", "Baripada", "Bhadrak", "Jharsuguda", "Angul", "Dhenkanal", "Koraput"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Hoshiarpur", "Moga", "Pathankot", "Batala", "Barnala", "Firozpur", "Kapurthala"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar", "Bhilwara", "Sikar", "Pali", "Tonk", "Churu", "Dholpur"],
    "Sikkim": ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Ravangla", "Jorethang", "Singtam", "Pelling", "Soreng"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Vellore", "Erode", "Thoothukudi", "Thanjavur", "Dindigul", "Nagercoil", "Karur"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar", "Adilabad", "Suryapet", "Miryalaguda", "Jagtial", "Siddipet"],
    "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Ambassa", "Belonia", "Kumarghat", "Sonamura"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Allahabad", "Noida", "Ghaziabad", "Meerut", "Aligarh", "Moradabad", "Bareilly", "Jhansi", "Gorakhpur", "Saharanpur"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Haldwani", "Roorkee", "Rudrapur", "Nainital", "Pithoragarh", "Almora", "Kashipur", "Mussoorie", "Tehri"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri", "Asansol", "Darjeeling", "Kharagpur", "Bardhaman", "Malda", "Berhampore", "Jalpaiguri", "Balurghat", "Cooch Behar"],
    "Delhi": ["New Delhi", "Delhi", "Dwarka", "Rohini", "Saket", "Pitampura", "Karol Bagh", "Vasant Kunj", "Mayur Vihar", "Lajpat Nagar", "Rajouri Garden"],
    "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur", "Kathua", "Kupwara", "Pulwama", "Poonch", "Rajouri", "Doda"],
    "Ladakh": ["Leh", "Kargil", "Diskit", "Nubra", "Padum"],
    "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam"],
    "Chandigarh": ["Chandigarh"],
    "Andaman and Nicobar Islands": ["Port Blair", "Havelock", "Diglipur", "Mayabunder", "Rangat", "Car Nicobar", "Kamorta", "Campbell Bay"],
    "Lakshadweep": ["Kavaratti", "Agatti", "Amini", "Andrott", "Minicoy", "Kalpeni", "Kadmat", "Chetlat", "Bitra"]
  };

  // --------- Populate Country Select ---------
  function populateCountries() {
    countrySelect.innerHTML = "";
    countriesData.forEach(country => {
      const opt = document.createElement('option');
      opt.value = country;
      opt.textContent = country;
      countrySelect.appendChild(opt);
    });
    // Always add "Others"
    const othersOpt = document.createElement('option');
    othersOpt.value = "Others";
    othersOpt.textContent = "Others";
    countrySelect.appendChild(othersOpt);
  }

  // --------- Populate State Select ---------
  function populateStates() {
    stateSelect.innerHTML = "";
    if (countrySelect.value === "India") {
      Object.keys(indiaData).forEach(state => {
        const opt = document.createElement('option');
        opt.value = state;
        opt.textContent = state;
        stateSelect.appendChild(opt);
      });
    }
    const othersOpt = document.createElement('option');
    othersOpt.value = "Others";
    othersOpt.textContent = "Others";
    stateSelect.appendChild(othersOpt);
    stateSelect.value = ""; // Reset selection
    populateCities(); // Reset cities
  }

  // --------- Populate City Select ---------
  function populateCities() {
    citySelect.innerHTML = "";
    if (countrySelect.value === "India" && indiaData[stateSelect.value]) {
      indiaData[stateSelect.value].forEach(city => {
        const opt = document.createElement('option');
        opt.value = city;
        opt.textContent = city;
        citySelect.appendChild(opt);
      });
    }
    const othersOpt = document.createElement('option');
    othersOpt.value = "Others";
    othersOpt.textContent = "Others";
    citySelect.appendChild(othersOpt);
    citySelect.value = ""; // Reset selection
  }

  // --------- Show/hide "Others" input fields ---------
  function toggleOtherField(field, select) {
    if(select.value === "Others") {
      otherFields[field].style.display = "block";
      otherFields[field].required = true;
    } else {
      otherFields[field].style.display = "none";
      otherFields[field].required = false;
    }
  }

  // --------- Name Validation (only alphabets) ---------
  nameInput.addEventListener('input', function() {
    // Allow only letters and spaces
    const valid = this.value.replace(/[^A-Za-z\s]/g, '');
    if (this.value !== valid) {
      this.value = valid;
    }
  });

  // --------- Phone Validation (only numbers, +, -) ---------
  phoneInput.addEventListener('input', function() {
    // Allow only digits, plus, minus
    const valid = this.value.replace(/[^0-9+\-]/g, '');
    if (this.value !== valid) {
      this.value = valid;
    }
  });

  // --------- Event listeners ---------
  countrySelect.addEventListener('change', () => {
    populateStates();
    toggleOtherField("country", countrySelect);
  });
  stateSelect.addEventListener('change', () => {
    populateCities();
    toggleOtherField("state", stateSelect);
  });
  citySelect.addEventListener('change', () => {
    toggleOtherField("city", citySelect);
  });

  // --------- Initial load ---------
  populateCountries();

  // --------- Form Submission Logic ---------
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Client-side validation
    if (!nameInput.value.match(/^[A-Za-z\s]+$/)) {
      alert("Name can contain alphabets and spaces only.");
      nameInput.focus();
      return;
    }
    if (!phoneInput.value.match(/^[0-9+\-]+$/)) {
      alert("Phone number can contain only numbers, + and -.");
      phoneInput.focus();
      return;
    }

    // Collect correct values for country, state, city (handle "Others")
    const countryValue = countrySelect.value === "Others" ? otherFields.country.value : countrySelect.value;
    const stateValue = stateSelect.value === "Others" ? otherFields.state.value : stateSelect.value;
    const cityValue = citySelect.value === "Others" ? otherFields.city.value : citySelect.value;
    const designationValue = form.elements['designation']?.value === "Others" ? otherFields.designation.value : form.elements['designation']?.value;
    const businessValue = form.elements['business']?.value === "Others" ? otherFields.business.value : form.elements['business']?.value;

    // Build data object - add other form fields as needed
    const data = {
      name: nameInput.value || "",
      email: form.elements['email']?.value || "",
      phone: phoneInput.value || "",
      country: countryValue,
      state: stateValue,
      city: cityValue,
      designation: designationValue,
      business: businessValue
      // Add other fields as necessary
    };

    // Send data to Google Script
    fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(result => {
      // Show popup or success message
      popup.style.display = 'block';
      // Reset form if needed
      form.reset();
      populateCountries();
      stateSelect.innerHTML = "";
      citySelect.innerHTML = "";
      Object.values(otherFields).forEach(field => {
        field.style.display = "none";
        field.required = false;
        field.value = "";
      });
    })
    .catch(error => {
      alert('Submission failed. Please check your connection and try again.\n' +
            'If the problem persists, contact support.\nError: ' + error.message);
    });
  });
});
