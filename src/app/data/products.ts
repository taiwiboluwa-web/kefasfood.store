import ugbaImage from 'figma:asset/c68c0bb059bf91dfdc6206da48546315d8141527.png';
import panlakikaImage from 'figma:asset/7118cc46343b577a92450aeb88fd326fad8d4038.png';
import crayfishPaintImage from 'figma:asset/0a9f2b114138428ca61e0e557f4b4132b5851ff2.png';
import crayfishImage from 'figma:asset/261d54092246126ed2155f95017b55f108ad31cd.png';
import stockfishImage from '../../imports/Gemini_Generated_Image_78idby78idby78id-1.png';
import marugboImage from 'figma:asset/88a61f331b32ea8fb5bd9a0eaf290f9b647b7f84.png';
import kilishiImage from 'figma:asset/bac21d5d3c8dff767e9554fc7d452d8699514f26.png';
import garriIjebuImage from 'figma:asset/1c260d02146d57917953c8a49e0728d4f386fed9.png';
import pupuruImage from 'figma:asset/43edfd391ba64c9c52521a1cf5bde6aed95b358f.png';
import tapiocaImage from 'figma:asset/47c2fa613a25f39ff15d07a5ab2837c35c010d21.png';
import garriYellowImage from 'figma:asset/40a538ddbe89d3666a8c50f1f98abd40fbf71da2.png';
import eluboImage from 'figma:asset/68e918be9298ccb4dca7cff4dd6ce5c3f0425a92.png';
import pepperSoupSpiceImage from 'figma:asset/6645c4914bf7815d1c474112fe941cbe4a096a1d.png';
import suyaSpiceImage from 'figma:asset/28afa8dccc68c6da0a8f2f3f0d4d174cb4f6733c.png';
import locustBeansImage from 'figma:asset/722ded55ffe51e39e2c4df0ea30b609251f8ebe7.png';
import tigernutImage from 'figma:asset/d0848aa8009f4e5d58e6460a5b847be7c570d060.png';
import zoboLeavesImage from 'figma:asset/92054193fec7e05317724e509ffb22324b88696d.png';
import palmOilImage from 'figma:asset/d8a5a00365cdb54f22b59aaa0e03fcf914385145.png';
import honeyBeansImage from 'figma:asset/29f480ce91a133c72d2f1a3962c30fef808d91fb.png';
import ofadaRiceImage from 'figma:asset/b0cf58245f714eb1d9144be20a945ed1c4c5067a.png';
import egusiImage from 'figma:asset/ab99c011473e774e205b9eb9899821cb2b635567.png';
import ogbonoImage from 'figma:asset/d74ad80a6452e0fe2b75370849699785edbe1b4b.png';
import abachaImage from 'figma:asset/d1504be10e0974e8e63dea9152c4c57311c1289b.png';
import catfishCutletImage from 'figma:asset/c936ffa90e5bc8b00c1a4bb4db38fafd1c06bf4f.png';
import goatMeatImage from 'figma:asset/e7cc9c8d2c13f5ed91f2f09ce18a7f4fc753b4e1.png';
import catfishWholeImage from 'figma:asset/83d89f967e1a0ece391945d11938af4141da88c4.png';
import okpaImage from 'figma:asset/37c421ad92e8a354927bc0c1e2aabe4b86c15e0d.png';
import ponmoImage from 'figma:asset/0587b6e475442fda6ea2a36d99ff4746a0c57ca9.png';
import unwashedPonmoImage from 'figma:asset/ded1cf880b7aba0f7fcd2e0fd192a98cafed2d11.png';
import soakedPonmoImage from 'figma:asset/d19dd2efbf5a9efc3e6f9d1f2bcc9e040248f24f.png';
import ukwaImage from 'figma:asset/5e0b9b1dce62ea4d9601cb55bd75464609b9ec41.png';
import bangaSpiceImage from 'figma:asset/4d3f9df38a81e709018b6b4511bca133aa22c7e8.png';
import driedPrawnImage from 'figma:asset/545af38a1d9aa52704af7612ca3fa6bfd4c1dc85.png';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  weight: string;
  description: string;
  image: string;
  imageUrl?: string; // Direct image URL for specific products
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
  // Cassava/Tuber Flakes
  {
    id: '1',
    name: 'Tapioca',
    category: 'Cassava/Tuber Flakes',
    price: 4.99,
    weight: '500g',
    description: 'Premium quality tapioca from cassava',
    image: 'tapioca cassava flour',
    imageUrl: tapiocaImage,
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
    imageUrl: pupuruImage,
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
    imageUrl: garriIjebuImage,
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
    imageUrl: garriYellowImage,
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
    imageUrl: eluboImage,
    inStock: true,
    badge: 'Popular',
    variants: [
      { weight: '2kg', price: 9.99 },
      { weight: '5kg', price: 23.99 }
    ]
  },

  // Spices & Flavors
  {
    id: '6',
    name: 'Pepper Soup Spices',
    category: 'Spices & Flavors',
    price: 1.49,
    weight: '50g',
    description: 'Authentic blended Nigerian pepper soup spice mix',
    image: 'pepper soup spices',
    imageUrl: pepperSoupSpiceImage,
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
    imageUrl: suyaSpiceImage,
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
    imageUrl: locustBeansImage,
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
    imageUrl: marugboImage,
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
    description: 'Authentic Nigerian banga spice blend - specially crafted for palm nut soup and stews. This aromatic mix of traditional herbs and spices brings out the rich, authentic flavor of banga dishes. Made from premium ingredients to deliver restaurant-quality taste at home.',
    image: 'banga spice seasoning',
    imageUrl: bangaSpiceImage,
    inStock: true,
    badge: 'Popular',
    variants: [
      { weight: '250g', price: 5.99 },
      { weight: '500g', price: 10.99 }
    ]
  },

  // Snacks, Drinks & Nuts
  {
    id: '11',
    name: 'Tigernut',
    category: 'Snacks, Drinks & Nuts',
    price: 4.99,
    weight: '500g',
    description: 'Premium tigernuts for drinks or snacking',
    image: 'tigernut drink',
    imageUrl: tigernutImage,
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
    imageUrl: zoboLeavesImage,
    inStock: true,
    badge: 'Popular'
  },

  // Oils
  {
    id: '13',
    name: 'Palm Oil',
    category: 'Oils',
    price: 7.49,
    weight: '1.5kg',
    description: 'Pure red palm oil from Nigeria',
    image: 'red palm oil',
    imageUrl: palmOilImage,
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

  // Grains & Seeds
  {
    id: '14',
    name: 'Sweet Honey Beans',
    category: 'Grains & Seeds',
    price: 9.99,
    weight: '2kg',
    description: 'Premium white honey beans',
    image: 'honey beans white',
    imageUrl: honeyBeansImage,
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
    description: 'Authentic Nigerian Ofada rice - unpolished brown rice with a unique aroma and nutty flavor, perfect for traditional Ofada sauce',
    image: 'ofada rice brown',
    imageUrl: ofadaRiceImage,
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
    imageUrl: egusiImage,
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
    imageUrl: ogbonoImage,
    inStock: true,
    badge: 'Popular'
  },

  // Traditional Dish
  {
    id: '18',
    name: 'Abacha',
    category: 'Traditional Dish',
    price: 4.99,
    weight: '250g',
    description: 'African salad (dried shredded cassava)',
    image: 'abacha african salad',
    imageUrl: abachaImage,
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
    imageUrl: ugbaImage,
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
    imageUrl: ukwaImage,
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
    imageUrl: okpaImage,
    inStock: true
  },

  // Meats & Protein
  {
    id: '22',
    name: 'Kilishi',
    category: 'Meats & Protein',
    price: 9.99,
    weight: '200g',
    description: 'Traditional Nigerian dried spiced meat',
    image: 'kilishi dried meat',
    imageUrl: kilishiImage,
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
    imageUrl: unwashedPonmoImage,
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
    imageUrl: ponmoImage,
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
    imageUrl: soakedPonmoImage,
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
    imageUrl: goatMeatImage,
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
    imageUrl: catfishCutletImage,
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
    imageUrl: catfishWholeImage,
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
    imageUrl: panlakikaImage,
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
    imageUrl: crayfishImage,
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
    imageUrl: crayfishPaintImage,
    inStock: true
  },
  {
    id: '32',
    name: 'Dried Prawns',
    category: 'Meats & Protein',
    price: 12.99,
    weight: '500g',
    description: 'Premium quality dried prawns - naturally sun-dried to preserve authentic taste and seafood essence. Perfect for enhancing the flavor of soups, stews, and traditional Nigerian dishes. Rich in protein and adds depth to any recipe.',
    image: 'dried prawns seafood',
    imageUrl: driedPrawnImage,
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
    imageUrl: stockfishImage,
    inStock: true,
    badge: 'Popular'
  }
];