import { db } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export type School = {
  name: string;
  type: string;
  domain: string;
};

const staticSchools: School[] = [
    { name: 'Ahmadu Bello University, Zaria', type: 'Federal', domain: 'abu.edu.ng' },
    { name: 'University of Lagos (UNILAG)', type: 'Federal', domain: 'unilag.edu.ng' },
    { name: 'University of Ibadan (UI)', type: 'Federal', domain: 'ui.edu.ng' },
    { name: 'Covenant University, Ota', type: 'Private', domain: 'covenantuniversity.edu.ng' },
    { name: 'Babcock University, Ilishan-Remo', type: 'Private', domain: 'babcock.edu.ng' },
];


let schoolsCache: School[] | null = null;

export async function getSchools(): Promise<School[]> {
  if (schoolsCache) {
    return schoolsCache;
  }

  try {
    const schoolsCollection = collection(db, 'schools');
    const q = query(schoolsCollection, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        console.log("No schools found in Firestore, using static list.");
        schoolsCache = staticSchools;
        return schoolsCache;
    }
      
    const schools: School[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      schools.push({
        name: data.name,
        type: data.type,
        domain: data.domain,
      });
    });
    schoolsCache = schools;
    return schools;
  } catch (error) {
    console.error("Error fetching schools from Firestore, using static list:", error);
    schoolsCache = staticSchools;
    return schoolsCache;
  }
}
