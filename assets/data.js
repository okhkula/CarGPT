// Static content for CarGPT: warning lights, tips, maintenance types and an offline car catalog.

export const SUGGESTED_QUESTIONS = [
  'What does this dashboard warning light mean?',
  'How often should I change my engine oil?',
  'Why is my car making a strange noise?',
  'How can I improve my fuel efficiency?',
  'What should I check before a long drive?',
];

export const MAINTENANCE_TYPES = [
  'Oil change',
  'Tire rotation',
  'Brake inspection',
  'Air filter replacement',
  'Battery check',
  'Vehicle inspection',
  'Registration renewal',
  'Other',
];

export const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Plug-in hybrid', 'Electric'];

export const POPULAR_BRANDS = [
  'Toyota', 'BMW', 'Honda', 'Volkswagen', 'Mercedes-Benz', 'Nissan', 'Ford',
  'Tesla', 'Audi', 'Hyundai', 'Kia', 'Mazda', 'Volvo', 'Subaru',
];

// Used only when the live car database cannot be reached.
export const FALLBACK_CATALOG = {
  Toyota: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Land Cruiser', 'Prado', 'Hilux', 'Yaris', 'Prius', 'Fortuner'],
  BMW: ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'i4', 'iX'],
  Honda: ['Civic', 'Accord', 'CR-V', 'HR-V', 'Pilot', 'City', 'Jazz'],
  Volkswagen: ['Golf', 'Polo', 'Passat', 'Jetta', 'Tiguan', 'Touareg', 'ID.4'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'G-Class', 'EQS'],
  Nissan: ['Altima', 'Sunny', 'Sentra', 'Maxima', 'X-Trail', 'Patrol', 'Kicks', 'Qashqai', 'Leaf'],
  Ford: ['Fiesta', 'Focus', 'Mustang', 'Escape', 'Explorer', 'Bronco', 'F-150', 'Ranger'],
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
  Audi: ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron GT'],
  Hyundai: ['Accent', 'Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Kona', 'Palisade', 'Ioniq 5'],
  Kia: ['Rio', 'Cerato', 'K5', 'Seltos', 'Sportage', 'Sorento', 'Telluride', 'EV6'],
  Mazda: ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-5', 'CX-9', 'MX-5'],
  Volvo: ['S60', 'S90', 'XC40', 'XC60', 'XC90', 'EX30'],
  Subaru: ['Impreza', 'Legacy', 'Outback', 'Forester', 'Crosstrek', 'WRX', 'BRZ'],
  Chevrolet: ['Spark', 'Malibu', 'Camaro', 'Equinox', 'Tahoe', 'Silverado'],
  Jeep: ['Wrangler', 'Compass', 'Cherokee', 'Grand Cherokee', 'Gladiator'],
  Lexus: ['IS', 'ES', 'LS', 'NX', 'RX', 'LX'],
  Mitsubishi: ['Mirage', 'Lancer', 'ASX', 'Outlander', 'Pajero'],
  Porsche: ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
  'Land Rover': ['Defender', 'Discovery', 'Range Rover', 'Range Rover Sport', 'Range Rover Evoque'],
};

// urgency: 'stop' = stop safely now, 'soon' = get it checked soon, 'check' = check when you can
export const WARNING_LIGHTS = [
  {
    id: 'check-engine',
    name: 'Check engine light',
    glyph: 'engine',
    urgency: 'soon',
    meaning: 'The car\'s computer has found a problem with the engine or the emissions system (the parts that clean the exhaust).',
    causes: ['Loose or damaged fuel cap', 'Worn spark plugs or ignition coils', 'A faulty sensor, such as the oxygen sensor', 'A problem with the catalytic converter'],
    action: 'If the light is steady, tighten the fuel cap and book a diagnostic check within a few days. If it is flashing, or the car is shaking or losing power, pull over somewhere safe and get help, because driving on can damage the engine.',
  },
  {
    id: 'battery',
    name: 'Battery warning',
    glyph: 'battery',
    urgency: 'soon',
    meaning: 'The battery is not being charged properly. The car is running on stored battery power, which will run out.',
    causes: ['Failing alternator (the part that charges the battery while you drive)', 'Loose or broken drive belt', 'Corroded or loose battery terminals', 'An old battery'],
    action: 'Switch off things you do not need, such as the AC and heated seats, and drive straight to a garage or somewhere safe. The engine may cut out once the battery is empty, so avoid long trips.',
  },
  {
    id: 'oil-pressure',
    name: 'Oil pressure warning',
    glyph: 'oil',
    urgency: 'stop',
    meaning: 'The engine may not be getting enough oil pressure. Oil keeps the moving metal parts from grinding against each other.',
    causes: ['Low oil level', 'A failing oil pump', 'A blocked oil filter or another lubrication-system problem'],
    action: 'Stop the car safely and switch off the engine. Do not keep driving with this light on. Check the oil level once the engine has cooled, and call for professional help.',
  },
  {
    id: 'brake',
    name: 'Brake warning',
    glyph: 'brake',
    urgency: 'stop',
    meaning: 'There may be a problem with the braking system, or the handbrake is still on.',
    causes: ['Handbrake (parking brake) not fully released', 'Low brake fluid', 'Worn brake pads', 'A leak in the brake system'],
    action: 'First check the handbrake is fully off. If the light stays on, or the brake pedal feels soft or sinks, stop safely and do not drive until the brakes have been inspected.',
  },
  {
    id: 'tire-pressure',
    name: 'Tire pressure warning',
    glyph: 'tire',
    urgency: 'soon',
    meaning: 'One or more tires has lower air pressure than it should.',
    causes: ['A slow puncture', 'A drop in temperature', 'Tires that have not been topped up for a while', 'A faulty pressure sensor'],
    action: 'Slow down and check all four tires at the next fuel station. Inflate them to the pressures on the sticker inside the driver\'s door. If a tire looks flat or keeps losing air, have it repaired before driving further.',
  },
  {
    id: 'abs',
    name: 'ABS warning',
    glyph: 'abs',
    urgency: 'soon',
    meaning: 'The anti-lock braking system (ABS) is switched off because of a fault. ABS stops the wheels locking up when you brake hard.',
    causes: ['A dirty or faulty wheel-speed sensor', 'Low brake fluid', 'A blown fuse or wiring fault'],
    action: 'Your normal brakes should still work, but the wheels can lock in an emergency stop. Leave more distance, brake gently, and have it checked soon. If the brake warning is on too, stop safely and get help.',
  },
  {
    id: 'airbag',
    name: 'Airbag warning',
    glyph: 'airbag',
    urgency: 'soon',
    meaning: 'There is a fault in the airbag or seat-belt system. The airbags may not open in a crash.',
    causes: ['A faulty sensor or connector, often under a seat', 'A problem with a seat-belt pretensioner', 'A low battery after a jump start'],
    action: 'The car can be driven, but you have less crash protection. Book an inspection as soon as you can, and do not try to repair airbag parts yourself.',
  },
  {
    id: 'engine-temp',
    name: 'Engine temperature warning',
    glyph: 'temp',
    urgency: 'stop',
    meaning: 'The engine is overheating.',
    causes: ['Low coolant (the liquid that carries heat away from the engine)', 'A coolant leak', 'A broken radiator fan or water pump', 'A stuck thermostat'],
    action: 'Pull over safely and switch off the engine. Wait at least 30 minutes before opening the bonnet, and never open the coolant cap while it is hot, because scalding liquid can spray out. Call for help if the level is low or the light comes back.',
  },
  {
    id: 'traction',
    name: 'Traction control warning',
    glyph: 'traction',
    urgency: 'check',
    meaning: 'Traction control stops the wheels spinning on slippery roads. A flashing light means it is working right now. A steady light means it is switched off or has a fault.',
    causes: ['Slippery road (flashing light)', 'The system was switched off with its button', 'A faulty wheel-speed sensor'],
    action: 'If it flashes, ease off the accelerator and drive smoothly. If it stays on, check you have not pressed the traction control button, drive carefully in the wet, and have it checked.',
  },
  {
    id: 'stability',
    name: 'Stability control warning',
    glyph: 'stability',
    urgency: 'check',
    meaning: 'Stability control helps keep the car pointing where you steer in a skid. A steady light means the system is off or has a fault.',
    causes: ['The system was switched off', 'A faulty steering-angle or wheel-speed sensor', 'A related ABS fault'],
    action: 'The car is safe to drive gently, but it will not help you in a skid. Slow down in corners and on wet roads, and book a check.',
  },
];

export const URGENCY = {
  stop: { label: 'Stop safely now', tone: 'red' },
  soon: { label: 'Get it checked soon', tone: 'amber' },
  check: { label: 'Check when you can', tone: 'green' },
};

export const TIPS = [
  'Check your tire pressures once a month and before long trips. Correct pressure saves fuel and helps the car grip the road.',
  'Keep at least a three-second gap to the car in front. Double it in rain.',
  'Smooth acceleration and early, gentle braking can cut fuel use noticeably in city driving.',
  'Check your engine oil with the dipstick every few weeks, when the engine is cool and the car is on level ground.',
  'Adjust your mirrors before you set off: you should only just see the side of your own car in each door mirror.',
  'If a warning light is red, treat it as "stop safely". Amber usually means "get it checked soon".',
  'Top up your windscreen washer fluid regularly. A dirty windscreen is dangerous in low sun.',
  'Tires with less than 1.6 mm of tread are unsafe and illegal in many countries. Replace them earlier for wet-road grip.',
  'Remove heavy items you do not need from the boot. Extra weight means extra fuel.',
  'When parking on a hill, turn the wheels toward the kerb when facing downhill and away from it when facing uphill.',
  'A car battery usually lasts three to five years. Slow engine starts are an early sign it is wearing out.',
  'Never open the coolant cap on a hot engine. Wait for it to cool down fully first.',
  'Before a long drive, check tires, oil, coolant, lights and washer fluid, and plan a break every two hours.',
  'Keep your fuel tank above a quarter full. Running very low can pull dirt into the fuel system.',
  'Use your indicators early. They tell other drivers what you plan to do, not what you are already doing.',
  'Squealing when you brake often means the brake pads are worn. Have them looked at soon.',
  'Replace wiper blades once a year, or sooner if they leave streaks.',
  'In heavy rain, slow down and switch on dipped headlights so other drivers can see you.',
  'Keep a small emergency kit in the car: water, a torch, a phone cable, a warning triangle and jumper cables.',
  'Read your owner\'s manual service schedule. It lists exactly when your car needs each service.',
  'A cabin air filter that is clogged makes the AC weaker and the windows fog up faster. It is cheap to replace.',
];
