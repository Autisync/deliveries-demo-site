// The demo day: a made-up business, its vans and its customers, in London
// (English) and Lisbon (Portuguese). Everything here is fictional.

export const DAYS = {
  en: {
    business: 'Northline Supplies',
    city: 'London',
    currency: 'GBP',
    locale: 'en-GB',
    depot: { name: 'Northline Supplies, Hackney Wick', lat: 51.5435, lng: -0.0240 },
    center: [51.548, -0.055], zoom: 13,
    vans: [
      {
        id: 'v1', driver: 'Tom Reid', vehicle: 'Van 1', color: '#B98B2F', you: true,
        stops: [
          { id: 'a1', ref: 'E-1041', name: 'Harlow Builders', person: 'Dan', address: '14 Mare Street, E8 4RP', lat: 51.5432, lng: -0.0553, from: '08:30', to: '10:00', items: '20 bags of cement, 2 pallets of blocks', amount: 486, order: 'PO-55871' },
          { id: 'a2', ref: 'E-1042', name: 'Priya Shah', person: 'Priya', address: '3 Albion Road, N16 9PS', lat: 51.5560, lng: -0.0790, from: '10:00', to: '12:00', items: 'Kitchen worktop (3 m)', amount: 220, customer: true },
          { id: 'a3', ref: 'E-1043', name: 'Green Lane Café', person: 'Ruth', address: '88 Green Lanes, N16 9EJ', lat: 51.5590, lng: -0.0880, from: '11:30', to: '13:30', items: '6 crates of tiles', amount: 96 },
          { id: 'a4', ref: 'E-1044', name: 'Dalston Dental', person: 'Mo', address: '5 Dalston Lane, E8 3DF', lat: 51.5465, lng: -0.0690, from: '13:00', to: '15:00', items: 'Supplies, 4 boxes', amount: 58 },
        ],
      },
      {
        id: 'v2', driver: 'Ana Costa', vehicle: 'Van 2', color: '#2563EB', delayLeg: 1, delayMinutes: 45,
        stops: [
          { id: 'b1', ref: 'E-1045', name: 'Brick Lane Interiors', person: 'Leo', address: '21 Brick Lane, E1 6PU', lat: 51.5205, lng: -0.0715, from: '08:45', to: '10:00', items: 'Sofa (2 seater)', amount: 95 },
          { id: 'b2', ref: 'E-1046', name: 'Bethnal Green Pharmacy', person: 'Grace', address: '210 Cambridge Heath Rd, E2 9NQ', lat: 51.5270, lng: -0.0550, from: '09:30', to: '10:45', items: 'Shelving kit', amount: 140 },
          { id: 'b3', ref: 'E-1047', name: 'Victoria Park Deli', person: 'Sofia', address: '2 Lauriston Rd, E9 7EY', lat: 51.5370, lng: -0.0420, from: '11:00', to: '13:00', items: '3 fridge units', amount: 310 },
        ],
      },
      {
        id: 'v3', driver: 'Sam Patel', vehicle: 'Van 3', color: '#7C3AED',
        stops: [
          { id: 'c1', ref: 'E-1048', name: 'Stratford Tiles', person: 'Ola', address: '12 Romford Rd, E15 4BZ', lat: 51.5430, lng: -0.0020, from: '08:45', to: '10:30', items: '40 m² floor tiles', amount: 520 },
          { id: 'c2', ref: 'E-1049', name: 'Leyton Café', person: 'Ken', address: '640 High Rd Leyton, E10 6RN', lat: 51.5640, lng: -0.0110, from: '10:30', to: '12:30', items: 'Coffee machine', amount: 180 },
          { id: 'c3', ref: 'E-1050', name: 'Clapton Bakery', person: 'Ines', address: '154 Lower Clapton Rd, E5 0QJ', lat: 51.5555, lng: -0.0530, from: '12:00', to: '14:30', items: '10 sacks of flour', amount: 75 },
        ],
      },
    ],
    // An order that arrives by email at 10:20, read into a delivery to check.
    emailOrder: {
      at: '09:05', from: 'orders@harbourcafe.example', subject: 'Order for tomorrow',
      body: 'Hi, could you deliver 12 crates of oat milk to Harbour Café, 7 Wharf Road N1 7GR tomorrow morning between 9 and 11? Order HC-2231. Ask for Mia. Thanks!',
      stop: { id: 'c4', ref: 'E-1051', name: 'Harbour Café', person: 'Mia', address: '7 Wharf Road, N1 7GR', lat: 51.5330, lng: -0.0960, from: '09:00', to: '11:00', items: '12 crates of oat milk', amount: 84, order: 'HC-2231', tomorrow: true },
    },
  },
  pt: {
    business: 'Fornecimentos Atlântico',
    city: 'Lisboa',
    currency: 'EUR',
    locale: 'pt-PT',
    depot: { name: 'Fornecimentos Atlântico, Marvila', lat: 38.7485, lng: -9.1035 },
    center: [38.733, -9.135], zoom: 13,
    vans: [
      {
        id: 'v1', driver: 'Rui Matos', vehicle: 'Carrinha 1', color: '#B98B2F', you: true,
        stops: [
          { id: 'a1', ref: 'E-1041', name: 'Obras Silva Lda', person: 'Sr. Silva', address: 'Rua das Flores 12, 1200-195', lat: 38.7105, lng: -9.1430, from: '08:30', to: '10:00', items: '30 sacos de cimento', amount: 410, order: 'ENC-2231' },
          { id: 'a2', ref: 'E-1042', name: 'Marta Lopes', person: 'Marta', address: 'Rua de Campo de Ourique 80, 1250-063', lat: 38.7175, lng: -9.1660, from: '10:00', to: '12:00', items: 'Bancada de cozinha (3 m)', amount: 260, customer: true },
          { id: 'a3', ref: 'E-1043', name: 'Café Estrela', person: 'Joana', address: 'Calçada da Estrela 41, 1200-661', lat: 38.7125, lng: -9.1580, from: '11:30', to: '13:30', items: '6 caixas de azulejo', amount: 96 },
          { id: 'a4', ref: 'E-1044', name: 'Clínica Dentária Amoreiras', person: 'Dr. Pires', address: 'Rua das Amoreiras 70, 1250-020', lat: 38.7240, lng: -9.1580, from: '13:00', to: '15:00', items: 'Material, 4 caixas', amount: 58 },
        ],
      },
      {
        id: 'v2', driver: 'Ana Costa', vehicle: 'Carrinha 2', color: '#2563EB', delayLeg: 1, delayMinutes: 45,
        stops: [
          { id: 'b1', ref: 'E-1045', name: 'Interiores Alfama', person: 'Leonor', address: 'Rua dos Remédios 21, 1100-445', lat: 38.7125, lng: -9.1290, from: '08:45', to: '10:00', items: 'Sofá (2 lugares)', amount: 95 },
          { id: 'b2', ref: 'E-1046', name: 'Farmácia da Graça', person: 'Graça', address: 'Largo da Graça 10, 1170-165', lat: 38.7175, lng: -9.1310, from: '09:30', to: '10:45', items: 'Kit de prateleiras', amount: 140 },
          { id: 'b3', ref: 'E-1047', name: 'Mercearia Penha', person: 'Sofia', address: 'Rua Penha de França 30, 1170-302', lat: 38.7270, lng: -9.1300, from: '11:00', to: '13:00', items: '3 vitrines frigoríficas', amount: 310 },
        ],
      },
      {
        id: 'v3', driver: 'Samuel Neto', vehicle: 'Carrinha 3', color: '#7C3AED',
        stops: [
          { id: 'c1', ref: 'E-1048', name: 'Azulejos Olivais', person: 'Paulo', address: 'Av. de Berlim 12, 1800-033', lat: 38.7650, lng: -9.1140, from: '08:45', to: '10:30', items: '40 m² de mosaico', amount: 520 },
          { id: 'c2', ref: 'E-1049', name: 'Café Areeiro', person: 'Rita', address: 'Praça Francisco Sá Carneiro 5, 1000-159', lat: 38.7425, lng: -9.1335, from: '10:30', to: '12:30', items: 'Máquina de café', amount: 180 },
          { id: 'c3', ref: 'E-1050', name: 'Padaria Arroios', person: 'Inês', address: 'Rua de Arroios 120, 1150-055', lat: 38.7330, lng: -9.1360, from: '12:00', to: '14:30', items: '10 sacos de farinha', amount: 75 },
        ],
      },
    ],
    emailOrder: {
      at: '09:05', from: 'encomendas@caferibeira.example', subject: 'Encomenda para amanhã',
      body: 'Bom dia, podem entregar 12 caixas de bebida de aveia no Café Ribeira, Cais do Sodré 7, 1200-450, amanhã de manhã entre as 9h e as 11h? Encomenda CR-2231. Perguntar pela Mia. Obrigada!',
      stop: { id: 'c4', ref: 'E-1051', name: 'Café Ribeira', person: 'Mia', address: 'Cais do Sodré 7, 1200-450', lat: 38.7060, lng: -9.1440, from: '09:00', to: '11:00', items: '12 caixas de bebida de aveia', amount: 84, order: 'CR-2231', tomorrow: true },
    },
  },
};
