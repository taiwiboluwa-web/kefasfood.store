export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  weight: string;
  description: string;
  image: string;
  imageUrl?: string;
  inStock: boolean;
  variants?: { weight: string; price: number }[];
  badge?: 'Popular' | 'Best Seller' | 'New';
}

export const categories = [
  'All Products',
  'Cassava/Tuber Flakes',
  'Spices & Flavors',
  'Snacks, Drinks & Nuts',
  'Oils',
  'Grains & Seeds',
  'Traditional Dish',
  'Meats & Protein'
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Tapioca',
    category: 'Cassava/Tuber Flakes',
    price: 4.99,
    weight: '500g',
    description: 'Premium quality tapioca from cassava',
    image: 'tapioca cassava flour',
    imageUrl: '/Tapioca.png',
    inStock: true
  },
  {
    id: '2',
    name: 'Pupuru',
    category: 'Cassava/Tuber Flakes',
    price: 7.99,
    weight: '2.5kg',
    description: 'Traditional fermented cassava flour',
    image: 'pupuru cassava',
    imageUrl: '/Pupuru.png',
    inStock: true,
    badge: 'Popular',
    variants: [
      { weight: '2.5kg', price: 7.99 },
      { weight: '5kg', price: 14.99 },
      { weight: '15kg', price: 39.99 }
    ]
  },
  {
    id: '3',
    name: 'Garri Ijebu',
    category: 'Cassava/Tuber Flakes',
    price: 5.99,
    weight: '2kg',
    description: 'Premium Ijebu garri with authentic taste',
    image: 'garri ijebu cassava',
    imageUrl: '/Garri Ijebu.png',
    inStock: true,
    badge: 'Best Seller',
    variants: [
      { weight: '2kg', price: 5.99 },
      { weight: '5kg', price: 13.99 }
    ]
  },
  {
    id: '4',
    name: 'Garri Yellow',
    category: 'Cassava/Tuber Flakes',
    price: 5.99,
    weight: '1.5kg',
    description: 'Finely processed yellow garri',
    image: 'yellow garri cassava',
    imageUrl: '/Garri Yellow.png',
    inStock: true,
    badge: 'Popular',
    variants: [
      { weight: '1.5kg', price: 5.99 },
      { weight: '5kg', price: 17.99 }
    ]
  },
  {
    id: '5',
    name: 'Elubo Yam Flour',
    category: 'Cassava/Tuber Flakes',
    price: 9.99,
    weight: '2kg',
    description: 'Pure yam flour for making amala',
    image: 'elubo yam flour',
    imageUrl: '/Elubo Yam Flour.png',
    inStock: true,
    badge: 'Popular',
    variants: [
      { weight: '2kg', price: 9.99 },
      { weight: '5kg', price: 23.99 }
    ]
  },
  {
    id: '6',
    name: 'Pepper Soup Spices',
    category: 'Spices & Flavors',
    price: 1.49,
    weight: '50g',
    description: 'Authentic blended Nigerian pepper soup spice mix',
    image: 'pepper soup spices',
    imageUrl: '/Pepper Soup Spices.png',
    inStock: true,
    badge: 'Best Seller',
    variants: [
      { weight: '50g', price: 1.49 },
      { weight: '150g', price: 3.49 },
      { weight: '300g', price: 4.99 }
    ]
  },
  {
    id: '7',
    name: 'Suya Spice',
    category: 'Spices & Flavors',
    price: 3.49,
    weight: '150g',
    description: 'Traditional suya spice blend for grilled meat',
    image: 'suya spice seasoning',
    imageUrl: '/Suya Spice.png',
    inStock: true,
    badge: 'Popular',
    variants: [
      { weight: '150g', price: 3.49 },
      { weight: '300g', price: 4.99 }
    ]
  },
  {
    id: '8',
    name: 'Iru Ekiti (Locust Beans)',
    category: 'Spices & Flavors',
    price: 2.49,
    weight: '200g',
    description: 'Fermented locust beans for soups and stews',
    image: 'locust beans iru',
    imageUrl: '/Iru Ekiti (Locust Beans).png',
    inStock: true,
    variants: [
      { weight: '200g', price: 2.49 },
      { weight: '300g', price: 4.99 }
    ]
  },
  {
    id: '9',
    name: 'Marugbo Spice',
    category: 'Spices & Flavors',
    price: 7.99,
    weight: '250g',
    description: 'Traditional soup herb mix - Premium marugbo blend for authentic Nigerian soups and stews',
    image: 'marugbo spices herbs',
    imageUrl: '/Marugbo Spice.png',
    inStock: true,
    badge: 'Best Seller',
    variants: [
      { weight: '250g', price: 7.99 },
      { weight: '500g', price: 14.99 },
      { weight: '1kg', price: 27.99 }
    ]
  },
  {
    id: '10',
    name: 'Banga Spice',
    category: 'Spices & Flavors',
    price: 5.99,
    weight: '250g',
    description: 'Authentic Nigerian banga spice blend - specially crafted for palm nut soup and stews.',
    image: 'banga spice seasoning',
    imageUrl: '/Banga Spice.png',
    inStock: true,
    badge: 'Popular',
    variants: [
      { weight: '250g', price: 5.99 },
      { weight: '500g', price: 10.99 }
    ]
  },
  {
    id: '11',
    name: 'Tigernut',
    category: 'Snacks, Drinks & Nuts',
    price: 4.99,
    weight: '500g',
    description: 'Premium tigernuts for drinks or snacking',
    image: 'tigernut drink',
    imageUrl: '/Tigernut.png',
    inStock: true
  },
  {
    id: '12',
    name: 'Zobo Leaves',
    category: 'Snacks, Drinks & Nuts',
    price: 3.99,
    weight: '300g',
    description: 'Dried hibiscus leaves for zobo drink',
    image: 'zobo hibiscus leaves',
    imageUrl: '/Zobo Leaves.png',
    inStock: true,
    badge: 'Popular'
  },
  {
    id: '13',
    name: 'Palm Oil',
    category: 'Oils',
    price: 7.49,
    weight: '1.5kg',
    description: 'Pure red palm oil from Nigeria',
    image: 'red palm oil',
    imageUrl: '/Palm Oil.png',
    inStock: true,
    badge: 'Best Seller',
    variants: [
      { weight: '1.5kg', price: 7.49 },
      { weight: '2.5kg', price: 12.49 },
      { weight: '5kg', price: 24.99 },
      { weight: '12.5kg', price: 54.99 },
      { weight: '25kg', price: 109.99 }
    ]
  },
  {
    id: '14',
    name: 'Sweet Honey Beans',
    category: 'Grains & Seeds',
    price: 9.99,
    weight: '2kg',
    description: 'Premium white honey beans',
    image: 'honey beans white',
    imageUrl: '/Sweet Honey Beans.png',
    inStock: true,
    badge: 'Popular',
    variants: [
      { weight: '2kg', price: 9.99 },
      { weight: '5kg', price: 23.99 }
    ]
  },
  {
    id: '15',
    name: 'Ofada Rice',
    category: 'Grains & Seeds',
    price: 6.99,
    weight: '1kg',
    description: 'Authentic Nigerian Ofada rice',
    image: 'ofada rice brown',
    imageUrl: '/Ofada Rice.png',
    inStock: true,
    badge: 'Popular',
    variants: [
      { weight: '1kg', price: 6.99 },
      { weight: '2kg', price: 12.99 }
    ]
  },
  {
    id: '16',
    name: 'Egusi',
    category: 'Grains & Seeds',
    price: 4.99,
    weight: '500g',
    description: 'Ground melon seeds for egusi soup',
    image: 'egusi melon seeds',
    imageUrl: '/Egusi.png',
    inStock: true,
    badge: 'Best Seller',
    variants: [
      { weight: '500g', price: 4.99 },
      { weight: '1kg', price: 9.99 },
      { weight: '2kg', price: 18.99 }
    ]
  },
  {
    id: '17',
    name: 'Ogbono',
    category: 'Grains & Seeds',
    price: 4.99,
    weight: '250g',
    description: 'Wild mango seeds for draw soup',
    image: 'ogbono wild mango',
    imageUrl: '/Ogbono.png',
    inStock: true,
    badge: 'Popular'
  },
  {
    id: '18',
    name: 'Abacha',
    category: 'Traditional Dish',
    price: 4.99,
    weight: '250g',
    description: 'African salad (dried shredded cassava)',
    image: 'abacha african salad',
    imageUrl: '/Abacha.png',
    inStock: true,
    badge: 'New'
  },
  {
    id: '19',
    name: 'Ugba',
    category: 'Traditional Dish',
    price: 7.99,
    weight: '250g',
    description: 'Sliced oil bean seed',
    image: 'ugba oil bean',
    imageUrl: '/Ugba.png',
    inStock: true
  },
  {
    id: '20',
    name: 'Ukwa',
    category: 'Traditional Dish',
    price: 6.48,
    weight: '500g',
    description: 'African breadfruit seeds',
    image: 'ukwa breadfruit',
    imageUrl: '/Ukwa.png',
    inStock: true
  },
  {
    id: '21',
    name: 'Okpa',
    category: 'Traditional Dish',
    price: 5.99,
    weight: '500g',
    description: 'Bambara nut flour',
    image: 'okpa bambara nut',
    imageUrl: '/Okpa.png',
    inStock: true
  },
  {
    id: '22',
    name: 'Kilishi',
    category: 'Meats & Protein',
    price: 9.99,
    weight: '200g',
    description: 'Traditional Nigerian dried spiced meat',
    image: 'kilishi dried meat',
    imageUrl: '/Kilishi.png',
    inStock: true,
    badge: 'Popular'
  },
  {
    id: '23',
    name: 'Unwashed Ponmo',
    category: 'Meats & Protein',
    price: 9.99,
    weight: '12 pieces',
    description: 'Dried cow skin - unwashed',
    image: 'ponmo cow skin',
    imageUrl: '/Unwashed Ponmo.png',
    inStock: true
  },
  {
    id: '24',
    name: 'Prewashed Dried Ponmo',
    category: 'Meats & Protein',
    price: 9.99,
    weight: '10 pieces',
    description: 'Prewashed dried cow skin',
    image: 'ponmo prewashed',
    imageUrl: '/Prewashed Dried Ponmo.png',
    inStock: true
  },
  {
    id: '25',
    name: 'Soaked Ponmo',
    category: 'Meats & Protein',
    price: 9.99,
    weight: '10 pieces',
    description: 'Ready to cook soaked ponmo',
    image: 'ponmo soaked',
    imageUrl: '/Soaked Ponmo.png',
    inStock: true
  },
  {
    id: '26',
    name: 'Naija Dried Goat Meat',
    category: 'Meats & Protein',
    price: 40.00,
    weight: '1.2kg',
    description: 'Premium dried Nigerian goat meat',
    image: 'dried goat meat',
    imageUrl: '/Naija Dried Goat Meat.png',
    inStock: true,
    badge: 'Best Seller'
  },
  {
    id: '27',
    name: 'Catfish Cutlet',
    category: 'Meats & Protein',
    price: 12.00,
    weight: '500g',
    description: 'Smoked catfish cutlet pieces',
    image: 'smoked catfish cutlet',
    imageUrl: '/Catfish Cutlet.png',
    inStock: true
  },
  {
    id: '28',
    name: 'Catfish Whole',
    category: 'Meats & Protein',
    price: 12.00,
    weight: '500g',
    description: 'Whole smoked catfish',
    image: 'smoked catfish whole',
    imageUrl: '/Catfish Whole.png',
    inStock: true
  },
  {
    id: '29',
    name: 'Panla Kika',
    category: 'Meats & Protein',
    price: 10.00,
    weight: '500g',
    description: 'Dried hake fish (panla)',
    image: 'panla kika fish',
    imageUrl: '/Panla Kika.png',
    inStock: true
  },
  {
    id: '30',
    name: 'Crayfish',
    category: 'Meats & Protein',
    price: 7.49,
    weight: '350g',
    description: 'Premium quality dried crayfish for soups',
    image: 'ground crayfish',
    imageUrl: '/Crayfish.png',
    inStock: true,
    badge: 'Popular',
    variants: [
      { weight: '350g', price: 7.49 },
      { weight: '600g', price: 14.99 }
    ]
  },
  {
    id: '31',
    name: 'Crayfish (Paint Plastic)',
    category: 'Meats & Protein',
    price: 15.00,
    weight: '650g',
    description: 'Premium quality Large pack of dried crayfish',
    image: 'crayfish large pack',
    imageUrl: '/Crayfish (Paint Plastic).png',
    inStock: true
  },
  {
    id: '32',
    name: 'Dried Prawns',
    category: 'Meats & Protein',
    price: 12.99,
    weight: '500g',
    description: 'Premium quality dried prawns',
    image: 'dried prawns seafood',
    imageUrl: '/Dried Prawns.png',
    inStock: true,
    badge: 'New',
    variants: [
      { weight: '250g', price: 7.99 },
      { weight: '500g', price: 12.99 },
      { weight: '1kg', price: 24.99 }
    ]
  },
  {
    id: '33',
    name: 'Stockfish',
    category: 'Meats & Protein',
    price: 2.00,
    weight: '90g',
    description: 'Premium quality dried stockfish',
    image: 'dried stockfish',
    imageUrl: '/Stockfish.png',
    inStock: true,
    badge: 'Popular'
  }
];
