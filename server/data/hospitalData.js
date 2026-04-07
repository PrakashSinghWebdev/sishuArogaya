/**
 * Comprehensive Indian hospital dataset.
 * coordinates format: [longitude, latitude]  (GeoJSON standard)
 */
const HOSPITALS = [
  // ── Uttarakhand ──────────────────────────────────────────────────────────
  { name:'All India Institute of Medical Sciences Rishikesh', type:'hospital', address:'Virbhadra Rd, Rishikesh', district:'Dehradun', state:'Uttarakhand', phone:'0135-2462916', isGovernment:true,  hasEmergency:true,  hasICU:true,  location:{ type:'Point', coordinates:[78.2650,30.0869] } },
  { name:'Doon Government Hospital',                          type:'hospital', address:'Sharanpur Road, Dehradun', district:'Dehradun', state:'Uttarakhand', phone:'0135-2714441', isGovernment:true,  hasEmergency:true,  hasICU:true,  location:{ type:'Point', coordinates:[78.0338,30.3165] } },
  { name:'Himalayan Institute Hospital',                      type:'hospital', address:'Swami Ram Nagar, Dehradun', district:'Dehradun', state:'Uttarakhand', phone:'0135-2417400', isGovernment:false, hasEmergency:true,  hasICU:true,  location:{ type:'Point', coordinates:[77.9831,30.2280] } },
  { name:'Base Hospital Srinagar Garhwal',                   type:'hospital', address:'Srinagar, Pauri Garhwal', district:'Pauri Garhwal', state:'Uttarakhand', phone:'01346-252280', isGovernment:true, hasEmergency:true, hasICU:false, location:{ type:'Point', coordinates:[78.7918,30.2255] } },
  { name:'District Hospital Haridwar',                       type:'hospital', address:'Ranipur More, Haridwar', district:'Haridwar', state:'Uttarakhand', phone:'01334-226506', isGovernment:true, hasEmergency:true, hasICU:true,  location:{ type:'Point', coordinates:[78.1642,29.9457] } },
  { name:'CHC Vikasnagar',                                   type:'clinic',   address:'Vikasnagar, Dehradun', district:'Dehradun', state:'Uttarakhand', phone:'', isGovernment:true, hasEmergency:false, hasICU:false, location:{ type:'Point', coordinates:[77.7570,30.4664] } },
  { name:'PHC Doiwala',                                      type:'health_post', address:'Doiwala, Dehradun', district:'Dehradun', state:'Uttarakhand', phone:'', isGovernment:true, hasEmergency:false, hasICU:false, location:{ type:'Point', coordinates:[78.1169,30.1664] } },
  { name:'District Hospital Nainital',                       type:'hospital', address:'Mall Road, Nainital', district:'Nainital', state:'Uttarakhand', phone:'05942-235014', isGovernment:true, hasEmergency:true, hasICU:false, location:{ type:'Point', coordinates:[79.4636,29.3802] } },
  { name:'Susheela Tiwari Government Hospital',              type:'hospital', address:'Haldwani, Nainital', district:'Nainital', state:'Uttarakhand', phone:'05946-224021', isGovernment:true, hasEmergency:true, hasICU:true,  location:{ type:'Point', coordinates:[79.5127,29.2183] } },
  { name:'District Hospital Almora',                         type:'hospital', address:'Mall Road, Almora', district:'Almora', state:'Uttarakhand', phone:'05962-230459', isGovernment:true, hasEmergency:true, hasICU:false, location:{ type:'Point', coordinates:[79.6635,29.5971] } },
  { name:'PHC Manali (Himachal Border)',                     type:'health_post', address:'Mall Road, Manali', district:'Kullu', state:'Himachal Pradesh', phone:'', isGovernment:true, hasEmergency:false, hasICU:false, location:{ type:'Point', coordinates:[77.1734,32.0849] } },

  // ── Delhi ────────────────────────────────────────────────────────────────
  { name:'AIIMS New Delhi',                                  type:'hospital', address:'Ansari Nagar, New Delhi', district:'South Delhi', state:'Delhi', phone:'011-26588500', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[77.2166,28.5672] } },
  { name:'Safdarjung Hospital',                              type:'hospital', address:'Ring Road, New Delhi', district:'South West Delhi', state:'Delhi', phone:'011-26730000', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[77.2056,28.5697] } },
  { name:'Ram Manohar Lohia Hospital',                       type:'hospital', address:'Baba Kharak Singh Marg, New Delhi', district:'Central Delhi', state:'Delhi', phone:'011-23404404', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[77.2090,28.6270] } },
  { name:'Lok Nayak Hospital',                               type:'hospital', address:'Jawahar Lal Nehru Marg, Delhi', district:'Central Delhi', state:'Delhi', phone:'011-23232400', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[77.2373,28.6414] } },
  { name:'GTB Hospital Delhi',                               type:'hospital', address:'Dilshad Garden, Delhi', district:'East Delhi', state:'Delhi', phone:'011-22581071', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[77.3113,28.6783] } },
  { name:'Max Super Speciality Hospital Saket',              type:'hospital', address:'Press Enclave Marg, Saket, Delhi', district:'South Delhi', state:'Delhi', phone:'011-26515050', isGovernment:false, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[77.2166,28.5244] } },
  { name:'Apollo Hospital Delhi',                            type:'hospital', address:'Sarita Vihar, Delhi', district:'South East Delhi', state:'Delhi', phone:'011-29871090', isGovernment:false, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[77.2843,28.5334] } },

  // ── Uttar Pradesh ────────────────────────────────────────────────────────
  { name:'King George Medical University',                   type:'hospital', address:'Shah Mina Road, Lucknow', district:'Lucknow', state:'Uttar Pradesh', phone:'0522-2257450', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[80.9462,26.8467] } },
  { name:'Ram Manohar Lohia Hospital Lucknow',               type:'hospital', address:'Vibhuti Khand, Lucknow', district:'Lucknow', state:'Uttar Pradesh', phone:'0522-2235834', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[80.9961,26.8553] } },
  { name:'SN Medical College Agra',                          type:'hospital', address:'Mahatma Gandhi Marg, Agra', district:'Agra', state:'Uttar Pradesh', phone:'0562-2463255', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[78.0081,27.1767] } },
  { name:'BHU Sir Sunder Lal Hospital',                      type:'hospital', address:'Lanka, Varanasi', district:'Varanasi', state:'Uttar Pradesh', phone:'0542-2368389', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[82.9975,25.2677] } },

  // ── Bihar ────────────────────────────────────────────────────────────────
  { name:'Patna Medical College Hospital',                   type:'hospital', address:'Ashok Rajpath, Patna', district:'Patna', state:'Bihar', phone:'0612-2300016', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[85.1376,25.5941] } },
  { name:'NMCH Patna',                                       type:'hospital', address:'Agam Kuan, Patna', district:'Patna', state:'Bihar', phone:'0612-2635232', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[85.1523,25.6139] } },
  { name:'IGIMS Patna',                                      type:'hospital', address:'Sheikhpura, Patna', district:'Patna', state:'Bihar', phone:'0612-2297631', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[85.0882,25.5934] } },

  // ── Rajasthan ────────────────────────────────────────────────────────────
  { name:'SMS Medical College & Hospital Jaipur',            type:'hospital', address:'JLN Marg, Jaipur', district:'Jaipur', state:'Rajasthan', phone:'0141-2518501', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[75.8235,26.9124] } },
  { name:'Mahatma Gandhi Hospital Jaipur',                   type:'hospital', address:'JLN Marg, Jaipur', district:'Jaipur', state:'Rajasthan', phone:'0141-2605106', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[75.8067,26.8778] } },
  { name:'District Hospital Jodhpur',                        type:'hospital', address:'Residency Road, Jodhpur', district:'Jodhpur', state:'Rajasthan', phone:'0291-2634050', isGovernment:true, hasEmergency:true, hasICU:false, location:{ type:'Point', coordinates:[73.0243,26.2389] } },

  // ── Gujarat ──────────────────────────────────────────────────────────────
  { name:'Civil Hospital Ahmedabad',                         type:'hospital', address:'Asarwa, Ahmedabad', district:'Ahmedabad', state:'Gujarat', phone:'079-22680058', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[72.5950,23.0469] } },
  { name:'Sterling Hospital Ahmedabad',                      type:'hospital', address:'Gurukul Road, Ahmedabad', district:'Ahmedabad', state:'Gujarat', phone:'079-40011000', isGovernment:false, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[72.5369,23.0440] } },
  { name:'New Civil Hospital Surat',                         type:'hospital', address:'Majura Gate, Surat', district:'Surat', state:'Gujarat', phone:'0261-2446060', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[72.8371,21.2016] } },

  // ── Maharashtra ──────────────────────────────────────────────────────────
  { name:'KEM Hospital Mumbai',                              type:'hospital', address:'Acharya Donde Marg, Parel, Mumbai', district:'Mumbai', state:'Maharashtra', phone:'022-24107000', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[72.8414,19.0020] } },
  { name:'Nair Hospital Mumbai',                             type:'hospital', address:'Dr A L Nair Rd, Mumbai Central', district:'Mumbai', state:'Maharashtra', phone:'022-23027600', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[72.8217,18.9659] } },
  { name:'Sassoon General Hospital Pune',                    type:'hospital', address:'Dhanraj Nana Chowk, Pune', district:'Pune', state:'Maharashtra', phone:'020-26128000', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[73.8734,18.5204] } },
  { name:'Government Medical College Nagpur',                type:'hospital', address:'Hanuman Nagar, Nagpur', district:'Nagpur', state:'Maharashtra', phone:'0712-2702462', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[79.1120,21.1497] } },
  { name:'Breach Candy Hospital Mumbai',                     type:'hospital', address:'Bhulabhai Desai Road, Mumbai', district:'Mumbai', state:'Maharashtra', phone:'022-23667888', isGovernment:false, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[72.8077,18.9715] } },

  // ── Karnataka ────────────────────────────────────────────────────────────
  { name:'Victoria Hospital Bengaluru',                      type:'hospital', address:'Fort Road, Bengaluru', district:'Bengaluru Urban', state:'Karnataka', phone:'080-26700000', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[77.5760,12.9706] } },
  { name:'Bowring & Lady Curzon Hospital',                   type:'hospital', address:'Shivaji Nagar, Bengaluru', district:'Bengaluru Urban', state:'Karnataka', phone:'080-25461060', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[77.5946,12.9783] } },
  { name:'Manipal Hospital Bengaluru',                       type:'hospital', address:'HAL Airport Rd, Bengaluru', district:'Bengaluru Urban', state:'Karnataka', phone:'080-25024444', isGovernment:false, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[77.6496,12.9584] } },
  { name:'District Hospital Mysuru',                         type:'hospital', address:'Irwin Road, Mysuru', district:'Mysuru', state:'Karnataka', phone:'0821-2524066', isGovernment:true, hasEmergency:true, hasICU:false, location:{ type:'Point', coordinates:[76.6479,12.3052] } },

  // ── Tamil Nadu ───────────────────────────────────────────────────────────
  { name:'Government General Hospital Chennai',              type:'hospital', address:'Park Town, Chennai', district:'Chennai', state:'Tamil Nadu', phone:'044-25305000', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[80.2782,13.0827] } },
  { name:'Stanley Medical College Hospital',                 type:'hospital', address:'Old Jail Road, Chennai', district:'Chennai', state:'Tamil Nadu', phone:'044-25281603', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[80.2907,13.1066] } },
  { name:'Apollo Hospitals Chennai',                         type:'hospital', address:'Greams Road, Chennai', district:'Chennai', state:'Tamil Nadu', phone:'044-28293333', isGovernment:false, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[80.2452,13.0583] } },
  { name:'Government Hospital Coimbatore',                   type:'hospital', address:'Trichy Road, Coimbatore', district:'Coimbatore', state:'Tamil Nadu', phone:'0422-2301945', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[76.9674,11.0168] } },

  // ── Telangana ────────────────────────────────────────────────────────────
  { name:'Osmania General Hospital Hyderabad',               type:'hospital', address:'Afzalgunj, Hyderabad', district:'Hyderabad', state:'Telangana', phone:'040-24600124', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[78.4743,17.3737] } },
  { name:'Gandhi Hospital Hyderabad',                        type:'hospital', address:'Musheerabad, Hyderabad', district:'Hyderabad', state:'Telangana', phone:'040-27505566', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[78.4985,17.4218] } },
  { name:'NIMS Hyderabad',                                   type:'hospital', address:'Punjagutta, Hyderabad', district:'Hyderabad', state:'Telangana', phone:'040-23489000', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[78.4472,17.4312] } },

  // ── Andhra Pradesh ───────────────────────────────────────────────────────
  { name:'Government General Hospital Vijayawada',           type:'hospital', address:'Governorpet, Vijayawada', district:'Krishna', state:'Andhra Pradesh', phone:'0866-2436601', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[80.6277,16.5062] } },
  { name:'Govt General Hospital Visakhapatnam',              type:'hospital', address:'Maharanipeta, Visakhapatnam', district:'Visakhapatnam', state:'Andhra Pradesh', phone:'0891-2564891', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[83.3031,17.7231] } },

  // ── West Bengal ──────────────────────────────────────────────────────────
  { name:'SSKM Hospital Kolkata',                            type:'hospital', address:'AJC Bose Road, Kolkata', district:'Kolkata', state:'West Bengal', phone:'033-22041739', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[88.3486,22.5349] } },
  { name:'Medical College Kolkata',                          type:'hospital', address:'College Street, Kolkata', district:'Kolkata', state:'West Bengal', phone:'033-22551234', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[88.3697,22.5744] } },
  { name:'Apollo Gleneagles Kolkata',                        type:'hospital', address:'Canal Circular Road, Kolkata', district:'Kolkata', state:'West Bengal', phone:'033-23201000', isGovernment:false, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[88.3953,22.5448] } },
  { name:'North Bengal Medical College',                     type:'hospital', address:'Sushruta Nagar, Siliguri', district:'Darjeeling', state:'West Bengal', phone:'0353-2580355', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[88.4166,26.7271] } },

  // ── Odisha ───────────────────────────────────────────────────────────────
  { name:'SCB Medical College Cuttack',                      type:'hospital', address:'Manglabag, Cuttack', district:'Cuttack', state:'Odisha', phone:'0671-2413590', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[85.8783,20.4625] } },
  { name:'AIIMS Bhubaneswar',                                type:'hospital', address:'Sijua, Bhubaneswar', district:'Khordha', state:'Odisha', phone:'0674-2476789', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[85.8191,20.1480] } },

  // ── Madhya Pradesh ───────────────────────────────────────────────────────
  { name:'Hamidia Hospital Bhopal',                          type:'hospital', address:'Royal Market, Bhopal', district:'Bhopal', state:'Madhya Pradesh', phone:'0755-2540204', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[77.4005,23.2599] } },
  { name:'MY Hospital Indore',                               type:'hospital', address:'Residency Area, Indore', district:'Indore', state:'Madhya Pradesh', phone:'0731-2536390', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[75.8577,22.7203] } },

  // ── Assam ─────────────────────────────────────────────────────────────
  { name:'Gauhati Medical College Hospital',                 type:'hospital', address:'Bhangagarh, Guwahati', district:'Kamrup Metropolitan', state:'Assam', phone:'0361-2529457', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[91.7362,26.1445] } },
  { name:'AIIMS Guwahati',                                   type:'hospital', address:'Changsari, Guwahati', district:'Kamrup', state:'Assam', phone:'0361-2367100', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[91.6117,26.1985] } },

  // ── Punjab & Haryana ─────────────────────────────────────────────────────
  { name:'PGIMER Chandigarh',                                type:'hospital', address:'Sector 12, Chandigarh', district:'Chandigarh', state:'Chandigarh', phone:'0172-2755555', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[76.7794,30.7646] } },
  { name:'Government Medical College Patiala',               type:'hospital', address:'Sangrur Road, Patiala', district:'Patiala', state:'Punjab', phone:'0175-2212025', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[76.3869,30.3398] } },

  // ── Kerala ───────────────────────────────────────────────────────────────
  { name:'Government Medical College Thiruvananthapuram',    type:'hospital', address:'Medical College PO, Thiruvananthapuram', district:'Thiruvananthapuram', state:'Kerala', phone:'0471-2528386', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[76.9474,8.5241] } },
  { name:'Kozhikode Government Medical College',             type:'hospital', address:'Medical College Rd, Kozhikode', district:'Kozhikode', state:'Kerala', phone:'0495-2350216', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[75.7804,11.2588] } },
  { name:'Amrita Institute of Medical Sciences Kochi',       type:'hospital', address:'Ponekkara, Edapally, Kochi', district:'Ernakulam', state:'Kerala', phone:'0484-2851234', isGovernment:false, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[76.3127,10.0225] } },

  // ── Jharkhand ─────────────────────────────────────────────────────────
  { name:'Rajendra Institute of Medical Sciences',           type:'hospital', address:'Bariatu Road, Ranchi', district:'Ranchi', state:'Jharkhand', phone:'0651-2542113', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[85.3096,23.3441] } },

  // ── Chhattisgarh ─────────────────────────────────────────────────────────
  { name:'Dr BR Ambedkar Hospital Raipur',                   type:'hospital', address:'GE Road, Raipur', district:'Raipur', state:'Chhattisgarh', phone:'0771-4248000', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[81.6296,21.2514] } },

  // ── Himachal Pradesh ─────────────────────────────────────────────────────
  { name:'IGMC Shimla',                                      type:'hospital', address:'Circular Road, Shimla', district:'Shimla', state:'Himachal Pradesh', phone:'0177-2804251', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[77.1734,31.1048] } },
  { name:'Dr RPGMC Kangra',                                  type:'hospital', address:'Tanda, Kangra', district:'Kangra', state:'Himachal Pradesh', phone:'01892-267115', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[76.3198,32.0846] } },

  // ── Goa ──────────────────────────────────────────────────────────────────
  { name:'Goa Medical College',                              type:'hospital', address:'Bambolim, Panaji', district:'North Goa', state:'Goa', phone:'0832-2458751', isGovernment:true, hasEmergency:true, hasICU:true, location:{ type:'Point', coordinates:[73.8567,15.4589] } },

  // ── Pharmacies & Clinics (sample across cities) ──────────────────────────
  { name:'Jan Aushadhi Kendra Delhi',                        type:'pharmacy', address:'Karol Bagh, New Delhi', district:'Central Delhi', state:'Delhi', phone:'', isGovernment:true, hasEmergency:false, hasICU:false, location:{ type:'Point', coordinates:[77.1890,28.6517] } },
  { name:'Jan Aushadhi Kendra Lucknow',                      type:'pharmacy', address:'Aminabad, Lucknow', district:'Lucknow', state:'Uttar Pradesh', phone:'', isGovernment:true, hasEmergency:false, hasICU:false, location:{ type:'Point', coordinates:[80.9317,26.8375] } },
  { name:'ESI Dispensary Dehradun',                          type:'clinic',   address:'Karanpur, Dehradun', district:'Dehradun', state:'Uttarakhand', phone:'', isGovernment:true, hasEmergency:false, hasICU:false, location:{ type:'Point', coordinates:[78.0447,30.3275] } },
  { name:'CHC Raipur Tehsil',                                type:'clinic',   address:'Raipur, Dehradun', district:'Dehradun', state:'Uttarakhand', phone:'', isGovernment:true, hasEmergency:false, hasICU:false, location:{ type:'Point', coordinates:[78.1500,30.2167] } },
  { name:'Urban Primary Health Centre Patna',                type:'health_post', address:'Kankarbagh, Patna', district:'Patna', state:'Bihar', phone:'', isGovernment:true, hasEmergency:false, hasICU:false, location:{ type:'Point', coordinates:[85.1483,25.5888] } },
  { name:'Community Health Centre Haridwar',                 type:'clinic',   address:'Jwalapur, Haridwar', district:'Haridwar', state:'Uttarakhand', phone:'', isGovernment:true, hasEmergency:false, hasICU:false, location:{ type:'Point', coordinates:[78.1301,29.9092] } },
  { name:'PHC Rishikesh',                                    type:'health_post', address:'Muni Ki Reti, Rishikesh', district:'Dehradun', state:'Uttarakhand', phone:'', isGovernment:true, hasEmergency:false, hasICU:false, location:{ type:'Point', coordinates:[78.3039,30.1127] } },
];

module.exports = HOSPITALS;
