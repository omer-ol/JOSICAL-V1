export const DOG_BREEDS: readonly string[] = [
  'Affenpinscher', 'Afghan Hound', 'Airedale Terrier', 'Akita', 'Alaskan Malamute',
  'American Bulldog', 'American Cocker Spaniel', 'American Pit Bull Terrier',
  'American Staffordshire Terrier', 'Australian Cattle Dog', 'Australian Shepherd',
  'Basenji', 'Basset Hound', 'Beagle', 'Belgian Malinois', 'Bernese Mountain Dog',
  'Bichon Frise', 'Bloodhound', 'Border Collie', 'Border Terrier', 'Boston Terrier',
  'Boxer', 'Brittany', 'Brussels Griffon', 'Bull Terrier', 'Bulldog', 'Bullmastiff',
  'Cairn Terrier', 'Canaan Dog', 'Cane Corso', 'Cavalier King Charles Spaniel',
  'Chesapeake Bay Retriever', 'Chihuahua', 'Chinese Crested', 'Chinese Shar-Pei',
  'Chow Chow', 'Cocker Spaniel', 'Collie', 'Corgi (Pembroke Welsh)', 'Corgi (Cardigan Welsh)',
  'Dachshund', 'Dalmatian', 'Doberman Pinscher', 'English Setter', 'English Springer Spaniel',
  'French Bulldog', 'German Pinscher', 'German Shepherd', 'German Shorthaired Pointer',
  'Golden Retriever', 'Gordon Setter', 'Great Dane', 'Great Pyrenees', 'Greyhound',
  'Havanese', 'Irish Setter', 'Irish Wolfhound', 'Italian Greyhound', 'Jack Russell Terrier',
  'Japanese Chin', 'Keeshond', 'Kerry Blue Terrier', 'Labrador Retriever', 'Lhasa Apso',
  'Maltese', 'Maltipoo', 'Miniature Pinscher', 'Miniature Schnauzer', 'Mixed Breed',
  'Newfoundland', 'Norfolk Terrier', 'Norwegian Elkhound', 'Old English Sheepdog',
  'Papillon', 'Pekingese', 'Pointer', 'Pomeranian', 'Poodle (Miniature)',
  'Poodle (Standard)', 'Poodle (Toy)', 'Portuguese Water Dog', 'Pug',
  'Rhodesian Ridgeback', 'Rottweiler', 'Saint Bernard', 'Saluki', 'Samoyed',
  'Schnauzer (Giant)', 'Schnauzer (Standard)', 'Scottish Terrier', 'Shetland Sheepdog',
  'Shiba Inu', 'Shih Tzu', 'Siberian Husky', 'Soft Coated Wheaten Terrier',
  'Staffordshire Bull Terrier', 'Tibetan Mastiff', 'Tibetan Terrier', 'Vizsla',
  'Weimaraner', 'West Highland White Terrier', 'Whippet', 'Wire Fox Terrier',
  'Yorkshire Terrier',
] as const

export const searchBreeds = (query: string): readonly string[] => {
  if (query.length < 2) return []
  const lower = query.toLowerCase()
  return DOG_BREEDS.filter((breed) => breed.toLowerCase().includes(lower))
}
