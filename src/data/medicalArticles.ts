import { Article } from "@/components/MedicalArticle";

export const medicalArticles: Article[] = [
  {
    id: "fever-guide",
    title: "Understanding Fever: When to Worry and When to Wait",
    category: "Symptoms",
    readTime: "8 min",
    tags: ["Fever", "Common Symptoms", "Emergency Signs"],
    summary: "Learn about fever causes, when it's dangerous, and how to manage it at home.",
    content: {
      overview: "Fever is a temporary increase in body temperature, often due to an illness. It's a sign that your body is fighting an infection. While fevers can be uncomfortable, they're generally not dangerous for adults unless they reach 103°F (39.4°C) or higher. For children, any fever in infants under 3 months requires immediate medical attention.",
      symptoms: [
        "Body temperature above 100.4°F (38°C)",
        "Sweating and shivering alternating",
        "Headache and muscle aches",
        "Loss of appetite",
        "Dehydration symptoms (decreased urination, dry mouth)",
        "General weakness and fatigue",
        "Irritability in children"
      ],
      causes: [
        "Viral infections (cold, flu, COVID-19)",
        "Bacterial infections (strep throat, urinary tract infections)",
        "Heat exhaustion or heatstroke",
        "Certain medications or vaccines",
        "Inflammatory conditions (arthritis, lupus)",
        "Malignancies (some cancers)",
        "Immunizations in children"
      ],
      treatment: [
        "Rest and stay hydrated with water, clear broths, or electrolyte solutions",
        "Take acetaminophen (Tylenol) or ibuprofen (Advil, Motrin) as directed",
        "Dress in light, comfortable clothing",
        "Use a lukewarm sponge bath (not cold water, which can cause shivering)",
        "Keep the room temperature comfortable (not too warm)",
        "Monitor temperature regularly every 2-4 hours",
        "For children: Never give aspirin to children due to Reye's syndrome risk"
      ],
      prevention: [
        "Wash hands frequently with soap and water for at least 20 seconds",
        "Avoid close contact with people who are sick",
        "Get recommended vaccinations (flu shot, COVID-19, etc.)",
        "Don't share drinks, utensils, or personal items",
        "Practice good hygiene (cover coughs and sneezes)",
        "Maintain a healthy immune system through proper diet and sleep"
      ],
      whenToSeek: "Seek immediate medical attention if: fever reaches 103°F (39.4°C) or higher in adults, any fever in infants under 3 months, fever lasts more than 3 days, accompanied by severe headache, stiff neck, confusion, difficulty breathing, persistent vomiting, rash, severe abdominal pain, or if you have a compromised immune system."
    }
  },
  {
    id: "respiratory-infections",
    title: "Common Respiratory Infections: Colds, Flu, and COVID-19",
    category: "Infectious Diseases",
    readTime: "10 min",
    tags: ["Cold", "Flu", "COVID-19", "Respiratory"],
    summary: "Comprehensive guide to understanding and differentiating between common respiratory infections.",
    content: {
      overview: "Respiratory infections affect the nose, throat, sinuses, and lungs. While they share similar symptoms, the common cold, influenza (flu), and COVID-19 are caused by different viruses and can vary significantly in severity. Understanding these differences helps you know when to seek medical care and how to prevent spread to others.",
      symptoms: [
        "Cold: Runny or stuffy nose, sneezing, sore throat, mild cough, usually no fever or low-grade fever",
        "Flu: Sudden onset of high fever, severe body aches, fatigue, dry cough, headache, sometimes nausea",
        "COVID-19: Fever, dry cough, fatigue, loss of taste or smell, shortness of breath, body aches",
        "All three may cause: Congestion, headache, fatigue, sore throat",
        "Duration: Cold 7-10 days, Flu 1-2 weeks, COVID-19 varies (2 weeks to several months for long COVID)"
      ],
      causes: [
        "Common Cold: Over 200 different viruses, most commonly rhinoviruses",
        "Influenza: Influenza A and B viruses, which mutate yearly",
        "COVID-19: SARS-CoV-2 virus and its variants",
        "Transmission: Respiratory droplets from coughing, sneezing, talking",
        "Surface contamination: Touching contaminated surfaces then touching face",
        "Airborne transmission: Especially in poorly ventilated indoor spaces",
        "Peak seasons: Cold (fall/winter), Flu (winter), COVID-19 (year-round with seasonal peaks)"
      ],
      treatment: [
        "Cold: Rest, fluids, over-the-counter decongestants and pain relievers, zinc lozenges may reduce duration",
        "Flu: Antiviral medications (Tamiflu) if started within 48 hours, rest, fluids, fever reducers",
        "COVID-19: Isolation, rest, fluids, fever reducers, antiviral medications for high-risk patients",
        "All: Stay home to prevent spread, get plenty of sleep, drink 8-10 glasses of water daily",
        "Symptom relief: Warm salt water gargles for sore throat, humidifier for congestion",
        "Honey (for those over 1 year) can soothe cough and throat",
        "Avoid smoking and secondhand smoke"
      ],
      prevention: [
        "Get annual flu vaccine and stay current with COVID-19 vaccinations",
        "Wash hands with soap and water for 20 seconds frequently",
        "Use hand sanitizer (at least 60% alcohol) when soap unavailable",
        "Wear masks in crowded indoor spaces or when transmission rates are high",
        "Maintain physical distance from sick individuals",
        "Improve indoor ventilation by opening windows when possible",
        "Clean and disinfect frequently touched surfaces regularly",
        "Avoid touching your face, especially eyes, nose, and mouth",
        "Maintain healthy lifestyle: adequate sleep, balanced diet, regular exercise, stress management"
      ],
      whenToSeek: "Seek medical care immediately if you experience: difficulty breathing or shortness of breath, persistent chest pain or pressure, new confusion or inability to stay awake, bluish lips or face, severe or persistent vomiting, dehydration signs, symptoms that improve then suddenly worsen, fever above 103°F that doesn't respond to medication, or if you're in a high-risk group (over 65, pregnant, immunocompromised, chronic conditions)."
    }
  },
  {
    id: "diabetes-management",
    title: "Living with Diabetes: Comprehensive Management Guide",
    category: "Chronic Conditions",
    readTime: "12 min",
    tags: ["Diabetes", "Chronic Disease", "Blood Sugar", "Lifestyle"],
    summary: "Essential information for understanding and managing diabetes effectively.",
    content: {
      overview: "Diabetes is a chronic condition affecting how your body processes blood sugar (glucose). Type 1 diabetes is an autoimmune condition where the body doesn't produce insulin. Type 2 diabetes, the most common form, occurs when the body becomes resistant to insulin or doesn't produce enough. Prediabetes is a condition where blood sugar levels are higher than normal but not high enough for a Type 2 diagnosis. With proper management, people with diabetes can live long, healthy lives.",
      symptoms: [
        "Increased thirst and frequent urination (polyuria and polydipsia)",
        "Extreme hunger even after eating",
        "Unexplained weight loss (Type 1) or weight gain (Type 2)",
        "Fatigue and weakness",
        "Blurred vision",
        "Slow-healing cuts or frequent infections",
        "Tingling or numbness in hands or feet",
        "Darkened skin patches (acanthosis nigricans) in armpits or neck",
        "Type 1 specific: Sudden onset, often in childhood or young adulthood",
        "Type 2 specific: Gradual onset, often in adults over 45"
      ],
      causes: [
        "Type 1: Autoimmune destruction of insulin-producing beta cells in the pancreas",
        "Type 2: Insulin resistance combined with inadequate insulin production",
        "Risk factors for Type 2: Obesity, sedentary lifestyle, family history, age over 45",
        "Prediabetes: Similar risk factors to Type 2 diabetes",
        "Gestational diabetes: Hormonal changes during pregnancy affecting insulin function",
        "Genetic predisposition plays a role in both types",
        "Environmental factors and viral triggers may contribute to Type 1"
      ],
      treatment: [
        "Type 1: Insulin therapy (injections or insulin pump) multiple times daily",
        "Type 2: May include metformin, other oral medications, or insulin as disease progresses",
        "Blood sugar monitoring: Regular testing with glucose meter or continuous glucose monitor (CGM)",
        "Target ranges: Fasting 80-130 mg/dL, 2 hours after meals below 180 mg/dL",
        "HbA1c testing: Every 3-6 months, target usually below 7%",
        "Dietary management: Consistent carbohydrate intake, focus on complex carbs, fiber, lean proteins",
        "Portion control and meal timing are crucial",
        "Regular exercise: At least 150 minutes of moderate activity per week",
        "Weight management: Even 5-10% weight loss can significantly improve Type 2 diabetes",
        "Regular medical checkups: Eye exams, foot exams, kidney function tests, cholesterol monitoring",
        "Medication adherence: Take all medications as prescribed"
      ],
      prevention: [
        "Type 2 Prevention: Maintain healthy weight (BMI 18.5-24.9)",
        "Exercise regularly: 30 minutes of moderate activity most days",
        "Eat a balanced diet: High in vegetables, fruits, whole grains, lean proteins",
        "Limit sugar and refined carbohydrates",
        "Choose water over sugary drinks",
        "Don't smoke: Smoking increases diabetes risk and complications",
        "Limit alcohol consumption",
        "Get regular health screenings if you're at risk",
        "Manage stress through meditation, yoga, or other relaxation techniques",
        "Get adequate sleep (7-9 hours per night)"
      ],
      whenToSeek: "Seek emergency care for: blood sugar below 70 mg/dL that doesn't improve with treatment (hypoglycemia), blood sugar above 250 mg/dL with ketones in urine (diabetic ketoacidosis), confusion or loss of consciousness, rapid breathing, fruity-smelling breath, severe abdominal pain, persistent vomiting. See your doctor if: you have symptoms of diabetes, blood sugar readings consistently outside target range, new or worsening complications (vision changes, foot sores, numbness), or difficulty managing your diabetes."
    }
  },
  {
    id: "hypertension-heart-health",
    title: "Heart Health: Understanding and Managing High Blood Pressure",
    category: "Cardiovascular",
    readTime: "10 min",
    tags: ["Heart Health", "Hypertension", "Prevention", "Chronic Disease"],
    summary: "Learn about hypertension, its risks, and how to maintain optimal cardiovascular health.",
    content: {
      overview: "Hypertension (high blood pressure) is when the force of blood against artery walls is consistently too high. Often called the 'silent killer' because it usually has no symptoms, hypertension affects nearly half of adults and is a major risk factor for heart disease, stroke, and kidney disease. Blood pressure is measured in millimeters of mercury (mmHg) with two numbers: systolic (top number) measures pressure when heart beats, diastolic (bottom number) measures pressure between beats. Normal is below 120/80 mmHg.",
      symptoms: [
        "Usually no symptoms until blood pressure becomes severely high",
        "When symptoms occur: Severe headaches, especially in back of head",
        "Shortness of breath or difficulty breathing",
        "Nosebleeds (epistaxis) without obvious cause",
        "Chest pain or tightness",
        "Vision problems or blurred vision",
        "Blood in urine (hematuria)",
        "Pounding sensation in chest, neck, or ears",
        "Dizziness or lightheadedness",
        "Fatigue or confusion"
      ],
      causes: [
        "Essential (primary) hypertension: No single identifiable cause, develops gradually over years",
        "Secondary hypertension: Caused by underlying condition (kidney disease, sleep apnea, thyroid problems)",
        "Risk factors: Age (risk increases after 65), family history, obesity",
        "Race: More common and severe in African Americans",
        "Chronic stress and anxiety",
        "High sodium diet (more than 2,300 mg per day)",
        "Low potassium intake",
        "Excessive alcohol consumption (more than 1-2 drinks daily)",
        "Lack of physical activity",
        "Tobacco use and secondhand smoke",
        "Certain medications: NSAIDs, birth control pills, decongestants",
        "Chronic conditions: Diabetes, kidney disease, sleep disorders"
      ],
      treatment: [
        "Lifestyle modifications (first-line treatment for most patients):",
        "DASH diet: Rich in fruits, vegetables, whole grains, low-fat dairy, limits sodium",
        "Sodium reduction: Limit to 2,300 mg (ideal: 1,500 mg) per day",
        "Weight loss: Every 2.2 lbs (1 kg) lost can lower blood pressure 1 mmHg",
        "Regular exercise: 150 minutes moderate or 75 minutes vigorous activity weekly",
        "Limit alcohol: Maximum 1 drink/day for women, 2 for men",
        "Medications (when lifestyle changes aren't enough):",
        "Diuretics (water pills): Help kidneys remove sodium and water",
        "ACE inhibitors: Relax blood vessels by blocking angiotensin formation",
        "ARBs (Angiotensin II receptor blockers): Similar to ACE inhibitors",
        "Calcium channel blockers: Relax blood vessel muscles",
        "Beta-blockers: Reduce heart rate and cardiac output",
        "Home monitoring: Check blood pressure regularly at same time daily",
        "Stress management: Meditation, deep breathing, yoga, adequate sleep"
      ],
      prevention: [
        "Maintain healthy weight: BMI between 18.5-24.9",
        "Follow DASH eating plan: Emphasize vegetables, fruits, whole grains",
        "Reduce sodium intake: Read food labels, avoid processed foods",
        "Increase potassium intake: Bananas, sweet potatoes, spinach, beans",
        "Exercise regularly: 30 minutes most days, include cardio and strength training",
        "Limit alcohol: No more than 1-2 drinks per day",
        "Don't smoke: Quit if you do, avoid secondhand smoke",
        "Manage stress: Practice relaxation techniques, ensure adequate sleep",
        "Regular checkups: Have blood pressure checked at least once every two years starting at 18",
        "If you have risk factors: Check more frequently",
        "Know your numbers: Understand what your readings mean",
        "Medication compliance: If prescribed, take as directed even when feeling well"
      ],
      whenToSeek: "Call 911 or seek emergency care immediately for hypertensive crisis (BP above 180/120 with): severe chest pain, severe headache with confusion or vision changes, difficulty breathing, severe anxiety, nosebleed, severe dizziness. Schedule doctor appointment if: blood pressure consistently above 130/80, experiencing side effects from blood pressure medications, having trouble controlling blood pressure despite treatment, or if you're at high risk and need regular monitoring."
    }
  },
  {
    id: "mental-health-anxiety-depression",
    title: "Mental Health: Understanding Anxiety and Depression",
    category: "Mental Health",
    readTime: "11 min",
    tags: ["Mental Health", "Anxiety", "Depression", "Wellness"],
    summary: "Comprehensive guide to recognizing and managing common mental health conditions.",
    content: {
      overview: "Mental health is as important as physical health. Anxiety and depression are among the most common mental health conditions, affecting millions worldwide. Anxiety involves excessive worry and fear that interferes with daily activities. Depression is characterized by persistent sadness and loss of interest in activities. Both are treatable medical conditions, not signs of weakness. With proper treatment, most people with these conditions experience significant improvement.",
      symptoms: [
        "Anxiety symptoms: Excessive worry difficult to control, restlessness or feeling on edge, easily fatigued",
        "Muscle tension, difficulty concentrating or mind going blank, irritability, sleep disturbances",
        "Panic attacks: Sudden intense fear, rapid heartbeat, sweating, trembling, shortness of breath",
        "Avoidance of situations that trigger anxiety",
        "Depression symptoms: Persistent sad, empty, or hopeless mood lasting most of the day",
        "Loss of interest or pleasure in activities once enjoyed (anhedonia)",
        "Significant weight changes or appetite changes",
        "Sleep problems (insomnia or sleeping too much)",
        "Physical slowing or agitation noticed by others",
        "Fatigue or loss of energy nearly every day",
        "Feelings of worthlessness or excessive guilt",
        "Difficulty concentrating or making decisions",
        "Recurrent thoughts of death or suicide"
      ],
      causes: [
        "Brain chemistry: Imbalances in neurotransmitters (serotonin, dopamine, norepinephrine)",
        "Genetics: Family history increases risk of both conditions",
        "Personality factors: Certain traits like perfectionism increase vulnerability",
        "Traumatic events: Abuse, death of loved one, difficult relationship, financial problems",
        "Chronic stress: Long-term exposure to stressful situations",
        "Medical conditions: Thyroid problems, heart disease, chronic pain",
        "Substance abuse: Alcohol or drug use can trigger or worsen symptoms",
        "Major life changes: Job loss, divorce, moving, retirement",
        "Childhood trauma or adverse experiences",
        "Social isolation and loneliness",
        "Chronic illness or disability"
      ],
      treatment: [
        "Psychotherapy (highly effective, often first-line treatment):",
        "Cognitive Behavioral Therapy (CBT): Identifies and changes negative thought patterns",
        "Exposure therapy for anxiety: Gradual exposure to feared situations",
        "Interpersonal therapy: Improves relationships and social functioning",
        "Mindfulness-based therapies: Teaches present-moment awareness",
        "Medications (when appropriate):",
        "SSRIs (Selective Serotonin Reuptake Inhibitors): Prozac, Zoloft, Lexapro",
        "SNRIs (Serotonin-Norepinephrine Reuptake Inhibitors): Effexor, Cymbalta",
        "Benzodiazepines (anxiety, short-term use): Xanax, Ativan",
        "Other antidepressants: Wellbutrin, Remeron",
        "Combination therapy: Often most effective is therapy plus medication",
        "Lifestyle modifications: Regular exercise (30 minutes daily can be as effective as medication)",
        "Sleep hygiene: Consistent sleep schedule, 7-9 hours per night",
        "Nutrition: Balanced diet, limit caffeine and alcohol",
        "Social support: Connect with friends, family, support groups",
        "Stress management: Relaxation techniques, time management"
      ],
      prevention: [
        "Build strong relationships: Maintain connections with supportive people",
        "Develop healthy coping strategies: Exercise, journaling, creative activities",
        "Practice stress management: Meditation, deep breathing, progressive muscle relaxation",
        "Get regular exercise: Aim for 30 minutes most days, releases mood-boosting endorphins",
        "Maintain consistent sleep schedule: 7-9 hours per night",
        "Eat nutritious diet: Include omega-3 fatty acids, complex carbs, lean proteins",
        "Limit alcohol and avoid drugs: Substance use can worsen mental health",
        "Set realistic goals: Break large tasks into smaller, manageable steps",
        "Challenge negative thoughts: Practice positive self-talk and reframing",
        "Stay engaged: Maintain hobbies and activities you enjoy",
        "Seek help early: Don't wait until symptoms become severe",
        "Regular checkups: Discuss mental health with your doctor",
        "Learn your triggers: Identify situations that worsen symptoms",
        "Practice self-compassion: Be kind to yourself during difficult times"
      ],
      whenToSeek: "Seek immediate help (call 988 Suicide & Crisis Lifeline or 911) if: thinking about suicide or self-harm, having thoughts of hurting others, experiencing psychotic symptoms (hearing voices, severe paranoia), unable to care for yourself. See a mental health professional soon if: symptoms persist for more than 2 weeks, symptoms interfere with work, school, or relationships, having frequent panic attacks, using alcohol or drugs to cope, experiencing physical symptoms (headaches, digestive issues) without clear cause, friends or family express concern about your mental health."
    }
  },
  {
    id: "digestive-health-guide",
    title: "Digestive Health: Common GI Issues and Solutions",
    category: "Digestive Health",
    readTime: "9 min",
    tags: ["Digestion", "GI Issues", "Stomach", "Gut Health"],
    summary: "Understanding common digestive problems and how to maintain optimal gut health.",
    content: {
      overview: "The digestive system breaks down food, absorbs nutrients, and eliminates waste. When it's not functioning properly, it affects overall health and quality of life. Common digestive issues include acid reflux (GERD), irritable bowel syndrome (IBS), constipation, and diarrhea. Many digestive problems can be managed with diet and lifestyle changes, though some require medical treatment. A healthy gut also supports immune function and mental health through the gut-brain axis.",
      symptoms: [
        "Heartburn and acid reflux: Burning sensation in chest, sour taste, difficulty swallowing",
        "Abdominal pain or cramping: Can be sharp, dull, or cramping",
        "Bloating and gas: Feeling of fullness, visible abdominal distension",
        "Constipation: Fewer than 3 bowel movements per week, hard stools, straining",
        "Diarrhea: Loose or watery stools, frequent bowel movements",
        "Nausea and vomiting",
        "Changes in bowel habits: Alternating between constipation and diarrhea",
        "Blood in stool: Bright red or dark, tarry stools (requires immediate medical attention)",
        "Unintended weight loss",
        "Persistent fatigue related to digestive issues",
        "Food intolerances: Symptoms after eating specific foods"
      ],
      causes: [
        "GERD (Acid Reflux): Weak lower esophageal sphincter, hiatal hernia, obesity, pregnancy",
        "IBS: Unknown exact cause, involves gut-brain interaction, stress, food sensitivities",
        "Constipation: Low fiber diet, dehydration, lack of exercise, ignoring urge to defecate, medications",
        "Diarrhea: Infections (viral, bacterial, parasitic), food intolerances, medications",
        "Food poisoning: Contaminated food or water",
        "Inflammatory conditions: Crohn's disease, ulcerative colitis, celiac disease",
        "Medications: Antibiotics, NSAIDs, acid reducers used long-term",
        "Stress and anxiety: Can trigger or worsen symptoms",
        "Eating too quickly or not chewing food thoroughly",
        "Alcohol and caffeine: Can irritate digestive tract",
        "High-fat, spicy, or processed foods",
        "Smoking: Weakens lower esophageal sphincter"
      ],
      treatment: [
        "For Acid Reflux/GERD:",
        "Eat smaller, more frequent meals rather than large meals",
        "Avoid trigger foods: Spicy, fatty, acidic foods, chocolate, mint, onions",
        "Don't lie down within 3 hours after eating",
        "Elevate head of bed 6-8 inches",
        "Antacids for quick relief, H2 blockers or PPIs for frequent symptoms",
        "For Constipation:",
        "Increase fiber intake to 25-35 grams daily gradually",
        "Drink 8-10 glasses of water daily",
        "Exercise regularly (even walking helps)",
        "Establish regular bathroom routine, don't ignore urge",
        "Consider fiber supplements (psyllium, methylcellulose)",
        "For Diarrhea:",
        "Stay hydrated with water, broth, electrolyte solutions",
        "Follow BRAT diet temporarily: Bananas, Rice, Applesauce, Toast",
        "Avoid dairy, fatty foods, caffeine during episode",
        "Probiotics may help restore gut bacteria",
        "For IBS:",
        "Keep food diary to identify triggers",
        "Try low-FODMAP diet under dietitian guidance",
        "Manage stress through therapy, meditation, yoga",
        "Medications: Antispasmodics, fiber supplements, probiotics as directed"
      ],
      prevention: [
        "Eat a high-fiber diet: Fruits, vegetables, whole grains, legumes",
        "Stay hydrated: Drink 8-10 glasses of water daily",
        "Exercise regularly: 30 minutes most days improves gut motility",
        "Manage stress: Practice relaxation techniques",
        "Eat mindfully: Chew thoroughly, eat slowly, pay attention to hunger cues",
        "Limit trigger foods: Identify and avoid foods that cause problems",
        "Moderate alcohol intake and avoid excessive caffeine",
        "Don't smoke: Smoking harms digestive system",
        "Maintain healthy weight: Obesity increases risk of GERD and other issues",
        "Probiotics: Consider probiotic-rich foods (yogurt, kefir, sauerkraut) or supplements",
        "Regular meal times: Eating on schedule supports digestive rhythm",
        "Food safety: Proper food handling, storage, and preparation",
        "Limit processed foods: High in unhealthy fats and low in fiber"
      ],
      whenToSeek: "Seek immediate care for: Severe abdominal pain, blood in vomit or stool (red or black/tarry), inability to have bowel movement with vomiting, signs of dehydration (dizziness, dark urine, no urination for 8+ hours), high fever with digestive symptoms, sudden, severe symptoms. See doctor soon if: Persistent symptoms lasting more than 2 weeks, unintended weight loss of 10+ pounds, difficulty or pain when swallowing, persistent nausea or vomiting, new symptoms after age 50, symptoms that wake you from sleep, family history of colon cancer or IBD."
    }
  }
];

export const categories = [
  "All Categories",
  "Symptoms",
  "Chronic Conditions",
  "Infectious Diseases",
  "Cardiovascular",
  "Mental Health",
  "Digestive Health",
  "Prevention"
];
