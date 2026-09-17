"""
AI Semantic Ticket Routing Evaluation Suite
Executes 80+ realistic test cases across all 8 government departments,
cross-department edge cases, and out-of-domain complaints.
Calculates exact real metrics: accuracy, per-department breakdown, margin distributions, latency.
"""

import os
import sys
import time
from typing import List, Dict, Any

# Ensure app package is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.department_service import department_service

TEST_CASES: List[Dict[str, Any]] = [
    # ==========================================
    # 1. WATER SUPPLY (11 cases)
    # ==========================================
    {
        "id": "WAT-01",
        "subject": "Drinking water supply interrupted",
        "description": "Drinking water has not been supplied to our street for the past 4 days. Please restore supply immediately.",
        "category": "Water Supply",
        "expected_dept": "Water Supply",
        "type": "clear"
    },
    {
        "id": "WAT-02",
        "subject": "Main pipeline burst and leaking clean water",
        "description": "There is a massive water leak from the underground pipeline on Gandhi Road. Clean drinking water is flowing on the road.",
        "category": "Water",
        "expected_dept": "Water Supply",
        "type": "clear"
    },
    {
        "id": "WAT-03",
        "subject": "Muddy and foul smelling tap water",
        "description": "The water coming from municipal taps is dark brown, smelling contaminated and completely unfit for drinking or cooking.",
        "category": None,
        "expected_dept": "Water Supply",
        "type": "quality"
    },
    {
        "id": "WAT-04",
        "subject": "Low water pressure",
        "description": "Water pressure is so low that water does not reach the ground floor taps, let alone the overhead tanks.",
        "category": "Water Supply",
        "expected_dept": "Water Supply",
        "type": "pressure"
    },
    {
        "id": "WAT-05",
        "subject": "Borewell pump motor burned",
        "description": "Community borewell submersible motor has stopped working due to coil burn. Entire street is suffering.",
        "category": "Water Supply",
        "expected_dept": "Water Supply",
        "type": "infrastructure"
    },
    {
        "id": "WAT-06",
        "subject": "Scheduled water tanker not arriving",
        "description": "Government water tanker scheduled for Tuesday morning did not come, leaving 50 families without water.",
        "category": "Water Supply",
        "expected_dept": "Water Supply",
        "type": "service"
    },
    {
        "id": "WAT-07",
        "subject": "Water pipe broken near junction",
        "description": "Broken pipe leaking water.",
        "category": None,
        "expected_dept": "Water Supply",
        "type": "short"
    },
    {
        "id": "WAT-08",
        "subject": "Thanni varala 4 naala",
        "description": "Enga area la 4 naala kudithaneer supply varala, lorry thanni kooda anuppala.",
        "category": None,
        "expected_dept": "Water Supply",
        "type": "transliterated_tamil"
    },
    {
        "id": "WAT-09",
        "subject": "Paani ki supply band hai",
        "description": "Hamare mohalle me do din se peene ka pani nahi aa raha hai. Pipeline me blockage hai.",
        "category": None,
        "expected_dept": "Water Supply",
        "type": "transliterated_hindi"
    },
    {
        "id": "WAT-10",
        "subject": "Sewage mixed in drinking water pipeline",
        "description": "Drainage water is infiltrating into the municipal drinking water supply pipe. Black water coming out.",
        "category": "Water Supply",
        "expected_dept": "Water Supply",
        "type": "contamination"
    },
    {
        "id": "WAT-11",
        "subject": "Overhead water tank leaking continuously",
        "description": "The public distribution water tank in Ward 12 has a large crack and water is overflowing onto the street non-stop.",
        "category": "Water Supply",
        "expected_dept": "Water Supply",
        "type": "infrastructure"
    },

    # ==========================================
    # 2. ELECTRICITY (11 cases)
    # ==========================================
    {
        "id": "ELE-01",
        "subject": "Frequent power outages in our locality",
        "description": "Severe power cuts occurring every evening from 6 PM to 10 PM. Students cannot study and elders are suffering in heat.",
        "category": "Electricity",
        "expected_dept": "Electricity",
        "type": "clear"
    },
    {
        "id": "ELE-02",
        "subject": "Street lights not functioning on 4th Cross",
        "description": "All street lights on 4th Cross Street have been out of order for 3 weeks. Road is pitch dark at night.",
        "category": "Electricity",
        "expected_dept": "Electricity",
        "type": "clear"
    },
    {
        "id": "ELE-03",
        "subject": "Transformer sparking dangerously",
        "description": "The neighborhood transformer caught fire and is sparking continuously. Immediate technician needed to prevent accident.",
        "category": "Electricity",
        "expected_dept": "Electricity",
        "type": "hazard"
    },
    {
        "id": "ELE-04",
        "subject": "Hanging high-voltage wire on footpath",
        "description": "An electric cable has snapped and is dangling just 3 feet above the walking path near the playground.",
        "category": "Electricity",
        "expected_dept": "Electricity",
        "type": "hazard"
    },
    {
        "id": "ELE-05",
        "subject": "Abnormally high electricity billing",
        "description": "Received an EB bill of Rs 18,000 for a small 1BHK house where normal bill is Rs 800. Meter is faulty.",
        "category": "Electricity",
        "expected_dept": "Electricity",
        "type": "billing"
    },
    {
        "id": "ELE-06",
        "subject": "Severe low voltage issue",
        "description": "Voltage drops to 130V every night. Refrigerator and ceiling fans are not functioning properly.",
        "category": "Electricity",
        "expected_dept": "Electricity",
        "type": "quality"
    },
    {
        "id": "ELE-07",
        "subject": "Power cut since morning",
        "description": "No electricity in house.",
        "category": None,
        "expected_dept": "Electricity",
        "type": "short"
    },
    {
        "id": "ELE-08",
        "subject": "Current illa theru vilakku eriyala",
        "description": "Theru vilakku work aagala, current cut aagiruchu, kambam saainju irukku.",
        "category": None,
        "expected_dept": "Electricity",
        "type": "transliterated_tamil"
    },
    {
        "id": "ELE-09",
        "subject": "Bijli gul hai subah se",
        "description": "Bijli ka transformer kharab ho gaya hai aur light bilkul nahi aa rahi hai.",
        "category": None,
        "expected_dept": "Electricity",
        "type": "transliterated_hindi"
    },
    {
        "id": "ELE-10",
        "subject": "Electric pole tilted dangerously",
        "description": "Cement electric pole is cracked at the base and leaning heavily towards a residential building.",
        "category": "Electricity",
        "expected_dept": "Electricity",
        "type": "infrastructure"
    },
    {
        "id": "ELE-11",
        "subject": "Digital meter reading jumping erratically",
        "description": "New smart digital electric meter is recording units even when the main circuit breaker is switched off.",
        "category": "Electricity",
        "expected_dept": "Electricity",
        "type": "meter"
    },

    # ==========================================
    # 3. ROADS & TRANSPORT (12 cases)
    # ==========================================
    {
        "id": "ROA-01",
        "subject": "Bus are not regular to our area",
        "description": "Bus are not regular to our area, Bus are not regular to our area",
        "category": "Roads & Transport",
        "expected_dept": "Roads & Transport",
        "type": "target_test_case"
    },
    {
        "id": "ROA-02",
        "subject": "Government bus frequency is very low",
        "description": "Government buses on route 19B arrive only once in 2 hours. Office commuters and school children face severe trouble.",
        "category": "Roads & Transport",
        "expected_dept": "Roads & Transport",
        "type": "transit"
    },
    {
        "id": "ROA-03",
        "subject": "No bus service to our village",
        "description": "Public bus connectivity to our village has been discontinued after road works. Villagers have to walk 5 km to reach bus stop.",
        "category": "Roads & Transport",
        "expected_dept": "Roads & Transport",
        "type": "transit"
    },
    {
        "id": "ROA-04",
        "subject": "Bus does not stop at designated bus stop",
        "description": "Bus drivers routinely bypass the bus stop near the market without halting for waiting passengers.",
        "category": "Roads & Transport",
        "expected_dept": "Roads & Transport",
        "type": "transit"
    },
    {
        "id": "ROA-05",
        "subject": "Dangerous deep potholes on Station Road",
        "description": "Main station road is riddled with massive craters and potholes. Multiple bike riders have fallen and sustained injuries.",
        "category": "Roads & Transport",
        "expected_dept": "Roads & Transport",
        "type": "roads"
    },
    {
        "id": "ROA-06",
        "subject": "Traffic signal malfunctioning at main junction",
        "description": "The automated traffic signal lights are not cycling, causing gridlock and severe congestion during peak hours.",
        "category": "Roads & Transport",
        "expected_dept": "Roads & Transport",
        "type": "traffic"
    },
    {
        "id": "ROA-07",
        "subject": "Need speed breaker near school crossing",
        "description": "Vehicles speed recklessly on this road. Urgent speed breaker required to prevent pedestrian accidents.",
        "category": "Roads & Transport",
        "expected_dept": "Roads & Transport",
        "type": "safety"
    },
    {
        "id": "ROA-08",
        "subject": "Road full of potholes",
        "description": "Road is completely broken.",
        "category": None,
        "expected_dept": "Roads & Transport",
        "type": "short"
    },
    {
        "id": "ROA-09",
        "subject": "Enga area ku bus regular ah varala",
        "description": "Perunthu timing sariya illa, bus stop la perunthu nikkama poguthu.",
        "category": None,
        "expected_dept": "Roads & Transport",
        "type": "transliterated_tamil"
    },
    {
        "id": "ROA-10",
        "subject": "Sadak kharab hai aur bus nahi aati",
        "description": "Hamare gaon me sadak par bade gaddhe hain aur sarkari bus time par nahi chal rahi hai.",
        "category": None,
        "expected_dept": "Roads & Transport",
        "type": "transliterated_hindi"
    },
    {
        "id": "ROA-11",
        "subject": "Incomplete tar road construction work",
        "description": "Contractor dug up the asphalt road for re-tarring 2 months ago and left loose stones everywhere without finishing.",
        "category": "Roads & Transport",
        "expected_dept": "Roads & Transport",
        "type": "roads"
    },
    {
        "id": "ROA-12",
        "subject": "Pedestrian footpath tiles broken",
        "description": "Footpath paving slabs are broken and open manholes on pavement pose grave threat to walkers.",
        "category": "Roads & Transport",
        "expected_dept": "Roads & Transport",
        "type": "roads"
    },

    # ==========================================
    # 4. SANITATION (11 cases)
    # ==========================================
    {
        "id": "SAN-01",
        "subject": "Garbage not collected for five days",
        "description": "Door-to-door solid waste collection vehicle has not visited our street for 5 days. Garbage bags are piling up.",
        "category": "Sanitation",
        "expected_dept": "Sanitation",
        "type": "waste"
    },
    {
        "id": "SAN-02",
        "subject": "Overflowing public dustbin spreading foul smell",
        "description": "The community green dustbin is overflowing on the road, creating unbearable foul smell and attracting stray dogs.",
        "category": "Sanitation",
        "expected_dept": "Sanitation",
        "type": "waste"
    },
    {
        "id": "SAN-03",
        "subject": "Open drainage overflowing on residential street",
        "description": "Underground storm water drain is clogged with silt, causing black sewage water to flood in front of houses.",
        "category": "Sanitation",
        "expected_dept": "Sanitation",
        "type": "drainage"
    },
    {
        "id": "SAN-04",
        "subject": "Public toilet in unhygienic condition",
        "description": "Municipal public toilet near bus terminus has no running water, blocked urinals, and is totally unsanitary.",
        "category": "Sanitation",
        "expected_dept": "Sanitation",
        "type": "toilets"
    },
    {
        "id": "SAN-05",
        "subject": "Dead stray animal on roadside",
        "description": "A dead dog has been lying on the pavement for two days. Needs immediate sanitary removal.",
        "category": "Sanitation",
        "expected_dept": "Sanitation",
        "type": "sanitary"
    },
    {
        "id": "SAN-06",
        "subject": "Mosquito breeding in stagnant drain water",
        "description": "Drainage desilting not done. Stagnant drain water is causing massive mosquito breeding and dengue hazard.",
        "category": "Sanitation",
        "expected_dept": "Sanitation",
        "type": "vector"
    },
    {
        "id": "SAN-07",
        "subject": "Garbage dump cleared required",
        "description": "Clean the trash heap.",
        "category": None,
        "expected_dept": "Sanitation",
        "type": "short"
    },
    {
        "id": "SAN-08",
        "subject": "Kuppai lorry varala saakadai naatram",
        "description": "Enga theru la kuppai allala, saakadai அடைத்து thanni velila varuthu.",
        "category": None,
        "expected_dept": "Sanitation",
        "type": "transliterated_tamil"
    },
    {
        "id": "SAN-09",
        "subject": "Kachra nahi uthaya gaya hai",
        "description": "Gali me kachre ka dher laga hai aur nali ka ganda pani sadak par beh raha hai.",
        "category": None,
        "expected_dept": "Sanitation",
        "type": "transliterated_hindi"
    },
    {
        "id": "SAN-10",
        "subject": "Septic tank waste dumped openly in vacant plot",
        "description": "Private sewage suction tankers are illegally discharging raw fecal waste into an open residential vacant plot.",
        "category": "Sanitation",
        "expected_dept": "Sanitation",
        "type": "drainage"
    },
    {
        "id": "SAN-11",
        "subject": "Street sweeping not conducted",
        "description": "Sanitation workers have not swept the residential avenues for two weeks, plastic litter scattered everywhere.",
        "category": "Sanitation",
        "expected_dept": "Sanitation",
        "type": "cleaning"
    },

    # ==========================================
    # 5. MUNICIPAL SERVICES (11 cases)
    # ==========================================
    {
        "id": "MUN-01",
        "subject": "Delay in issuing birth certificate",
        "description": "Submitted application for child birth certificate 40 days ago at municipal ward office, no status update provided.",
        "category": "Municipal Services",
        "expected_dept": "Municipal Services",
        "type": "certificates"
    },
    {
        "id": "MUN-02",
        "subject": "Illegal shop encroachment on public pavement",
        "description": "Commercial shopkeepers have erected permanent sheds occupying the pedestrian walkway on Market Street.",
        "category": "Municipal Services",
        "expected_dept": "Municipal Services",
        "type": "encroachment"
    },
    {
        "id": "MUN-03",
        "subject": "Property tax assessment duplicate demand",
        "description": "Received duplicate property tax assessment demand notice despite having paid annual tax online.",
        "category": "Municipal Services",
        "expected_dept": "Municipal Services",
        "type": "tax"
    },
    {
        "id": "MUN-04",
        "subject": "Public children park swings broken and neglected",
        "description": "Municipal park swings and slides are rusty and broken, and park benches are damaged.",
        "category": "Municipal Services",
        "expected_dept": "Municipal Services",
        "type": "civic"
    },
    {
        "id": "MUN-05",
        "subject": "Unauthorized building construction without approved plan",
        "description": "Commercial complex construction is proceeding without mandatory municipal plan sanction and setback rules.",
        "category": "Municipal Services",
        "expected_dept": "Municipal Services",
        "type": "permits"
    },
    {
        "id": "MUN-06",
        "subject": "Stray cattle menace on public street",
        "description": "Dozens of stray cows and bulls wandering on the main road causing danger to motorists.",
        "category": "Municipal Services",
        "expected_dept": "Municipal Services",
        "type": "civic"
    },
    {
        "id": "MUN-07",
        "subject": "Trade license renewal pending",
        "description": "Applied for trade license renewal.",
        "category": "Municipal Services",
        "expected_dept": "Municipal Services",
        "type": "short"
    },
    {
        "id": "MUN-08",
        "subject": "Nagaratchi office la pirappu saandrithazh",
        "description": "Pirappu saandrithazh kidaikkala, aakkiramippu theruvil athigama irukku.",
        "category": None,
        "expected_dept": "Municipal Services",
        "type": "transliterated_tamil"
    },
    {
        "id": "MUN-09",
        "subject": "Nagar nigam death certificate issue",
        "description": "Mrityu praman patra me naam galat darj ho gaya hai, sudhar ke liye application pending hai.",
        "category": None,
        "expected_dept": "Municipal Services",
        "type": "transliterated_hindi"
    },
    {
        "id": "MUN-10",
        "subject": "Illegal hoardings and flex banners on junction",
        "description": "Massive unapproved political flex banners erected blocking driver vision at the main rotary.",
        "category": "Municipal Services",
        "expected_dept": "Municipal Services",
        "type": "civic"
    },
    {
        "id": "MUN-11",
        "subject": "Death certificate correction application delayed",
        "description": "Requested correction in date of demise on death certificate 3 weeks ago, municipal registrar not responding.",
        "category": "Municipal Services",
        "expected_dept": "Municipal Services",
        "type": "certificates"
    },

    # ==========================================
    # 6. PUBLIC HEALTH (11 cases)
    # ==========================================
    {
        "id": "HLT-01",
        "subject": "Primary Health Centre doctor absent during duty hours",
        "description": "Government PHC doctor is consistently absent during OPD hours from 8 AM to 12 PM, leaving poor patients stranded.",
        "category": "Public Health",
        "expected_dept": "Public Health",
        "type": "hospital"
    },
    {
        "id": "HLT-02",
        "subject": "Shortage of essential diabetes medicines in Government Hospital",
        "description": "Government Taluk Hospital pharmacy has been out of stock for insulin and BP tablets for the past month.",
        "category": "Public Health",
        "expected_dept": "Public Health",
        "type": "medicines"
    },
    {
        "id": "HLT-03",
        "subject": "Dengue fever cases rising medical camp needed",
        "description": "Over 15 residents diagnosed with dengue in our ward. Requesting urgent mobile health team and medical testing camp.",
        "category": "Public Health",
        "expected_dept": "Public Health",
        "type": "epidemic"
    },
    {
        "id": "HLT-04",
        "subject": "No anti-rabies injection vaccine at health centre",
        "description": "Went to local government dispensary for anti-rabies vaccine after dog bite, but staff said no injections available.",
        "category": "Public Health",
        "expected_dept": "Public Health",
        "type": "vaccine"
    },
    {
        "id": "HLT-05",
        "subject": "Unhygienic conditions in hospital maternity ward",
        "description": "Maternity ward beds are dirty, washrooms not disinfected, and bio-medical waste bins are overflowing inside ward.",
        "category": "Public Health",
        "expected_dept": "Public Health",
        "type": "hospital"
    },
    {
        "id": "HLT-06",
        "subject": "Food adulteration in local restaurant",
        "description": "Restaurant is using spoiled stale meat and adulterated cooking oil. Food safety inspector inspection required.",
        "category": "Public Health",
        "expected_dept": "Public Health",
        "type": "food_safety"
    },
    {
        "id": "HLT-07",
        "subject": "Medicine not available in GH",
        "description": "Hospital out of tablets.",
        "category": None,
        "expected_dept": "Public Health",
        "type": "short"
    },
    {
        "id": "HLT-08",
        "subject": "Arasu maruthuvamanai doctor illai",
        "description": "Maruthuvamanai la marunthu mathirai kidaikkala, doctor duty ku varala.",
        "category": None,
        "expected_dept": "Public Health",
        "type": "transliterated_tamil"
    },
    {
        "id": "HLT-09",
        "subject": "Sarkari aspatal me dawai nahi mil rahi",
        "description": "Sarkari aspatal me doctor absent hai aur injection dawai khatam hai.",
        "category": None,
        "expected_dept": "Public Health",
        "type": "transliterated_hindi"
    },
    {
        "id": "HLT-10",
        "subject": "Ambulance 108 delay in emergency case",
        "description": "Called 108 emergency ambulance for cardiac patient, vehicle arrived after 90 minutes due to lack of stationed ambulances.",
        "category": "Public Health",
        "expected_dept": "Public Health",
        "type": "ambulance"
    },
    {
        "id": "HLT-11",
        "subject": "Childhood vaccination drive dates not notified",
        "description": "Primary health workers did not conduct the scheduled pulse polio and measles immunization drive in our village.",
        "category": "Public Health",
        "expected_dept": "Public Health",
        "type": "vaccine"
    },

    # ==========================================
    # 7. REVENUE (11 cases)
    # ==========================================
    {
        "id": "REV-01",
        "subject": "Delay in online Patta name transfer",
        "description": "Applied for land Patta transfer online 60 days ago. File is pending at Village Administrative Officer level without progress.",
        "category": "Revenue",
        "expected_dept": "Revenue",
        "type": "patta"
    },
    {
        "id": "REV-02",
        "subject": "Government surveyor not coming for land demarcation",
        "description": "Paid survey fees 3 months ago for land sub-division measurement, taluk surveyor has postponed visit 4 times.",
        "category": "Revenue",
        "expected_dept": "Revenue",
        "type": "survey"
    },
    {
        "id": "REV-03",
        "subject": "Community caste certificate pending for college admission",
        "description": "Submitted caste certificate application for student counseling. Taluk revenue inspector has not submitted field verification report.",
        "category": "Revenue",
        "expected_dept": "Revenue",
        "type": "certificate"
    },
    {
        "id": "REV-04",
        "subject": "Spelling mistake in Chitta land record",
        "description": "Land owner name has been wrongly entered in Tamil Nilam portal compared to registered sale deed. Correction requested.",
        "category": "Revenue",
        "expected_dept": "Revenue",
        "type": "records"
    },
    {
        "id": "REV-05",
        "subject": "Legal heir certificate delayed at Tahsildar office",
        "description": "Father passed away 6 months ago, legal heir certificate application is stuck in Tahsildar office for verification.",
        "category": "Revenue",
        "expected_dept": "Revenue",
        "type": "certificate"
    },
    {
        "id": "REV-06",
        "subject": "Income certificate rejected without explanation",
        "description": "Online income certificate application was rejected without stating any discrepancy or missing document reason.",
        "category": "Revenue",
        "expected_dept": "Revenue",
        "type": "certificate"
    },
    {
        "id": "REV-07",
        "subject": "Patta transfer file pending",
        "description": "Land record not updated.",
        "category": "Revenue",
        "expected_dept": "Revenue",
        "type": "short"
    },
    {
        "id": "REV-08",
        "subject": "VAO patta transfer sign pannala",
        "description": "Patta peyar maatram panna VAO office la file 2 maasama mudiyamal irukku, nilam alavu seiyya surveyor varala.",
        "category": None,
        "expected_dept": "Revenue",
        "type": "transliterated_tamil"
    },
    {
        "id": "REV-09",
        "subject": "Tehsil me zameen ka dakhil kharij",
        "description": "Zameen ki registry ho chuki hai par patwari dakhil kharij khasra mutation nahi kar raha hai.",
        "category": None,
        "expected_dept": "Revenue",
        "type": "transliterated_hindi"
    },
    {
        "id": "REV-10",
        "subject": "Dispute over boundary demarcation by VAO",
        "description": "Adjoining agricultural plot owner moved boundary stones. Requested official taluk revenue survey intervention.",
        "category": "Revenue",
        "expected_dept": "Revenue",
        "type": "survey"
    },
    {
        "id": "REV-11",
        "subject": "Nativity and residence certificate delay",
        "description": "Applied for government job verification nativity certificate, revenue inspector pending inquiry.",
        "category": "Revenue",
        "expected_dept": "Revenue",
        "type": "certificate"
    },

    # ==========================================
    # 8. EDUCATION (11 cases)
    # ==========================================
    {
        "id": "EDU-01",
        "subject": "Shortage of teachers in Government High School",
        "description": "Class 9 and 10 have no Science and Maths teachers for the last 6 months. Students' board exam preparation is suffering.",
        "category": "Education",
        "expected_dept": "Education",
        "type": "teachers"
    },
    {
        "id": "EDU-02",
        "subject": "School building classroom roof leaking during rain",
        "description": "Ceiling plaster fell down in Class 4 room. Water leaks from roof during rains, creating hazardous condition for children.",
        "category": "Education",
        "expected_dept": "Education",
        "type": "infrastructure"
    },
    {
        "id": "EDU-03",
        "subject": "Substandard quality of mid-day meal food",
        "description": "The mid-day lunch served in village primary school had insects in rice and watery dal without nutrition.",
        "category": "Education",
        "expected_dept": "Education",
        "type": "welfare"
    },
    {
        "id": "EDU-04",
        "subject": "Lack of functional toilets for girl students",
        "description": "Government Higher Secondary School has 400 girl students but zero functional, clean toilet facilities.",
        "category": "Education",
        "expected_dept": "Education",
        "type": "infrastructure"
    },
    {
        "id": "EDU-05",
        "subject": "Free government textbooks and notebooks not distributed",
        "description": "Even after 3 months of academic term starting, free textbooks and uniforms have not been provided to students.",
        "category": "Education",
        "expected_dept": "Education",
        "type": "supplies"
    },
    {
        "id": "EDU-06",
        "subject": "Private school demanding excessive unapproved fees",
        "description": "School management is forcing parents to pay Rs 30,000 extra donation fee in violation of state fee committee rules.",
        "category": "Education",
        "expected_dept": "Education",
        "type": "fees"
    },
    {
        "id": "EDU-07",
        "subject": "School teacher not coming",
        "description": "No teacher in school.",
        "category": None,
        "expected_dept": "Education",
        "type": "short"
    },
    {
        "id": "EDU-08",
        "subject": "Arasu palli sathunavu sariyilla",
        "description": "Palli kattidam mosam, aasiriyar illai, sathunavu unavu tharamaga illai.",
        "category": None,
        "expected_dept": "Education",
        "type": "transliterated_tamil"
    },
    {
        "id": "EDU-09",
        "subject": "Sarkari school me padhai nahi ho rahi",
        "description": "School me teacher absent rehte hain aur bacho ke liye bench desk aur kitab nahi mili hai.",
        "category": None,
        "expected_dept": "Education",
        "type": "transliterated_hindi"
    },
    {
        "id": "EDU-10",
        "subject": "RTE 25 percent admission refusal by private school",
        "description": "School administration rejected RTE quota application of economically weaker section student despite valid document.",
        "category": "Education",
        "expected_dept": "Education",
        "type": "admission"
    },
    {
        "id": "EDU-11",
        "subject": "School playground boundary wall collapsed",
        "description": "School playground wall broke down, allowing stray animals and anti-social elements into school premises during class hours.",
        "category": "Education",
        "expected_dept": "Education",
        "type": "infrastructure"
    },

    # ==========================================
    # 9. CROSS-DEPARTMENT COMPLEX CASES (4 cases)
    # ==========================================
    {
        "id": "CROSS-01",
        "subject": "Street light near bus stop is not working",
        "description": "The street light lamp on the pole right next to the bus stop has fused and is dark at night. Needs new bulb.",
        "category": None,
        "expected_dept": "Electricity",
        "type": "cross_dept_light_vs_bus"
    },
    {
        "id": "CROSS-02",
        "subject": "Road near hospital is damaged",
        "description": "The main tar road leading up to the government hospital entrance is full of deep potholes causing ambulances to jerk heavily.",
        "category": None,
        "expected_dept": "Roads & Transport",
        "type": "cross_dept_road_vs_hospital"
    },
    {
        "id": "CROSS-03",
        "subject": "Water pipe near school is leaking",
        "description": "Underground drinking water distribution pipeline near the government school gate has burst, flooding clean water onto the street.",
        "category": None,
        "expected_dept": "Water Supply",
        "type": "cross_dept_water_vs_school"
    },
    {
        "id": "CROSS-04",
        "subject": "Bus stop road is damaged",
        "description": "The asphalt road surface inside the bus shelter bay is completely broken with gravel and mud.",
        "category": None,
        "expected_dept": "Roads & Transport",
        "type": "cross_dept_road_vs_bus"
    },

    # ==========================================
    # 10. OUT-OF-DOMAIN CASES (3 cases)
    # Must NOT receive fake high confidence -> must be flagged_for_review
    # ==========================================
    {
        "id": "OOD-01",
        "subject": "Quantum physics equation is wrong",
        "description": "The Schrodinger equation wave function derivative calculation seems mathematically inconsistent in the textbook.",
        "category": None,
        "expected_dept": None,
        "type": "out_of_domain"
    },
    {
        "id": "OOD-02",
        "subject": "Help me with my programming assignment",
        "description": "Write a python script that implements quicksort using recursion and prints output.",
        "category": None,
        "expected_dept": None,
        "type": "out_of_domain"
    },
    {
        "id": "OOD-03",
        "subject": "Movie ticket booking issue",
        "description": "I booked two cinema tickets on an online website and payment was deducted but tickets not confirmed.",
        "category": None,
        "expected_dept": None,
        "type": "out_of_domain"
    }
]


def run_evaluation():
    print("=" * 70)
    print("AI SEMANTIC ROUTING QUALITY & ACCURACY EVALUATION")
    print(f"Total Test Cases: {len(TEST_CASES)}")
    print("=" * 70)

    # Initialize department embeddings cache
    t0 = time.perf_counter()
    department_service.load_departments()
    init_time = (time.perf_counter() - t0) * 1000
    print(f"Department knowledge cache initialized in {init_time:.2f} ms")
    print(f"Active departments in model: {department_service.departments_count}\n")

    in_domain_total = 0
    in_domain_correct = 0
    in_domain_completed = 0
    in_domain_flagged = 0

    ood_total = 0
    ood_safely_flagged = 0

    dept_stats: Dict[str, Dict[str, int]] = {}
    latencies: List[float] = []

    results_table = []

    for test in TEST_CASES:
        t_start = time.perf_counter()
        result = department_service.route_grievance(
            subject=test["subject"],
            description=test["description"],
            category=test.get("category"),
            location=test.get("location"),
            preferred_language=test.get("preferred_language")
        )
        latency_ms = (time.perf_counter() - t_start) * 1000
        latencies.append(latency_ms)

        expected = test["expected_dept"]
        predicted = result.predicted_department
        conf = result.confidence_score
        sem_score = result.semantic_score
        status = result.routing_status

        top2_score = result.top_predictions[1].score if len(result.top_predictions) > 1 else 0.0
        margin = round(conf - top2_score, 4)

        if expected is not None:
            # In-domain case
            in_domain_total += 1
            is_correct = (predicted == expected)
            if is_correct:
                in_domain_correct += 1

            if status == "completed":
                in_domain_completed += 1
            else:
                in_domain_flagged += 1

            if expected not in dept_stats:
                dept_stats[expected] = {"total": 0, "correct": 0, "completed": 0, "flagged": 0}
            dept_stats[expected]["total"] += 1
            if is_correct:
                dept_stats[expected]["correct"] += 1
            if status == "completed" and is_correct:
                dept_stats[expected]["completed"] += 1
            else:
                dept_stats[expected]["flagged"] += 1

            verdict = "PASS" if is_correct else "FAIL"
        else:
            # Out-of-domain case
            ood_total += 1
            is_safely_flagged = (status == "flagged_for_review")
            if is_safely_flagged:
                ood_safely_flagged += 1
            verdict = "PASS (Flagged)" if is_safely_flagged else "FAIL (Unsafe Assign)"

        results_table.append({
            "id": test["id"],
            "type": test["type"],
            "subject": test["subject"],
            "expected": expected or "[OOD - Flag]",
            "predicted": predicted,
            "conf": conf,
            "sem": sem_score,
            "margin": margin,
            "status": status,
            "verdict": verdict,
            "latency": latency_ms
        })

    # Print summary table
    print(f"{'ID':<9} {'Type':<22} {'Expected':<18} {'Predicted':<18} {'Conf':<7} {'Sem':<7} {'Margin':<7} {'Status':<18} {'Verdict'}")
    print("-" * 120)
    for r in results_table:
        print(f"{r['id']:<9} {r['type']:<22} {r['expected'][:17]:<18} {r['predicted'][:17]:<18} {r['conf']:<7.4f} {r['sem']:<7.4f} {r['margin']:<7.4f} {r['status']:<18} {r['verdict']}")

    print("\n" + "=" * 70)
    print("PER-DEPARTMENT BREAKDOWN")
    print("=" * 70)
    print(f"{'Department':<22} {'Total':<7} {'Correct':<9} {'Accuracy %':<12} {'Completed':<11} {'Flagged':<9}")
    print("-" * 70)
    for dept, s in dept_stats.items():
        acc = (s["correct"] / s["total"]) * 100 if s["total"] > 0 else 0
        print(f"{dept:<22} {s['total']:<7} {s['correct']:<9} {acc:<12.1f} {s['completed']:<11} {s['flagged']:<9}")

    print("\n" + "=" * 70)
    print("OVERALL EVALUATION METRICS")
    print("=" * 70)
    overall_acc = (in_domain_correct / in_domain_total) * 100 if in_domain_total > 0 else 0
    ood_safety_rate = (ood_safely_flagged / ood_total) * 100 if ood_total > 0 else 0
    avg_latency = sum(latencies) / len(latencies) if latencies else 0

    print(f"Total In-Domain Test Cases     : {in_domain_total}")
    print(f"Correct Department Predictions : {in_domain_correct} / {in_domain_total}")
    print(f"Overall Routing Accuracy       : {overall_acc:.2f}%")
    print(f"Completed (High-Confidence)    : {in_domain_completed} ({in_domain_completed/in_domain_total*100:.1f}%)")
    print(f"Flagged for Human Review       : {in_domain_flagged} ({in_domain_flagged/in_domain_total*100:.1f}%)")
    print(f"Out-of-Domain Safety Rate      : {ood_safely_flagged} / {ood_total} ({ood_safety_rate:.1f}% safely flagged)")
    print(f"Average Routing Latency        : {avg_latency:.2f} ms")
    print("=" * 70)

    # Specific bus test case check
    bus_test = next(r for r in results_table if r["id"] == "ROA-01")
    print("\nSPECIFIC TARGET BUS TEST CASE RESULT:")
    print(f"Subject      : '{bus_test['subject']}'")
    print(f"Predicted    : {bus_test['predicted']}")
    print(f"Conf Score   : {bus_test['conf']}")
    print(f"Semantic     : {bus_test['sem']}")
    print(f"Margin       : {bus_test['margin']}")
    print(f"Status       : {bus_test['status']}")
    print(f"Verdict      : {bus_test['verdict']}")

if __name__ == "__main__":
    run_evaluation()
