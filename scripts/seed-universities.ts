import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
/**
 * Seed script: U.S. Universities
 * Run: npm run seed:universities
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface UniversitySeed {
  name: string;
  city: string;
  state: string;
  website: string;
}

const UNIVERSITIES: UniversitySeed[] = [
  { name: "University of Central Florida", city: "Orlando", state: "FL", website: "https://www.ucf.edu" },
  { name: "Texas A&M University", city: "College Station", state: "TX", website: "https://www.tamu.edu" },
  { name: "Ohio State University", city: "Columbus", state: "OH", website: "https://www.osu.edu" },
  { name: "University of Texas at Austin", city: "Austin", state: "TX", website: "https://www.utexas.edu" },
  { name: "Florida International University", city: "Miami", state: "FL", website: "https://www.fiu.edu" },
  { name: "University of Florida", city: "Gainesville", state: "FL", website: "https://www.ufl.edu" },
  { name: "Michigan State University", city: "East Lansing", state: "MI", website: "https://www.msu.edu" },
  { name: "Arizona State University", city: "Tempe", state: "AZ", website: "https://www.asu.edu" },
  { name: "University of Minnesota", city: "Minneapolis", state: "MN", website: "https://www.umn.edu" },
  { name: "Pennsylvania State University", city: "University Park", state: "PA", website: "https://www.psu.edu" },
  { name: "Rutgers University", city: "New Brunswick", state: "NJ", website: "https://www.rutgers.edu" },
  { name: "Indiana University", city: "Bloomington", state: "IN", website: "https://www.iu.edu" },
  { name: "University of Washington", city: "Seattle", state: "WA", website: "https://www.uw.edu" },
  { name: "University of Illinois Urbana-Champaign", city: "Urbana", state: "IL", website: "https://illinois.edu" },
  { name: "University of Michigan", city: "Ann Arbor", state: "MI", website: "https://umich.edu" },
  { name: "University of Wisconsin-Madison", city: "Madison", state: "WI", website: "https://www.wisc.edu" },
  { name: "University of Arizona", city: "Tucson", state: "AZ", website: "https://www.arizona.edu" },
  { name: "Texas Tech University", city: "Lubbock", state: "TX", website: "https://www.ttu.edu" },
  { name: "University of Georgia", city: "Athens", state: "GA", website: "https://www.uga.edu" },
  { name: "University of Colorado Boulder", city: "Boulder", state: "CO", website: "https://www.colorado.edu" },
  { name: "University of South Florida", city: "Tampa", state: "FL", website: "https://www.usf.edu" },
  { name: "Purdue University", city: "West Lafayette", state: "IN", website: "https://www.purdue.edu" },
  { name: "North Carolina State University", city: "Raleigh", state: "NC", website: "https://www.ncsu.edu" },
  { name: "University of California Los Angeles", city: "Los Angeles", state: "CA", website: "https://www.ucla.edu" },
  { name: "University of California Berkeley", city: "Berkeley", state: "CA", website: "https://www.berkeley.edu" },
  { name: "University of California San Diego", city: "San Diego", state: "CA", website: "https://www.ucsd.edu" },
  { name: "University of North Carolina Chapel Hill", city: "Chapel Hill", state: "NC", website: "https://www.unc.edu" },
  { name: "University of Virginia", city: "Charlottesville", state: "VA", website: "https://www.virginia.edu" },
  { name: "Virginia Tech", city: "Blacksburg", state: "VA", website: "https://www.vt.edu" },
  { name: "Iowa State University", city: "Ames", state: "IA", website: "https://www.iastate.edu" },
  { name: "University of Iowa", city: "Iowa City", state: "IA", website: "https://www.uiowa.edu" },
  { name: "University of Kentucky", city: "Lexington", state: "KY", website: "https://www.uky.edu" },
  { name: "University of Tennessee", city: "Knoxville", state: "TN", website: "https://www.utk.edu" },
  { name: "Auburn University", city: "Auburn", state: "AL", website: "https://www.auburn.edu" },
  { name: "University of Alabama", city: "Tuscaloosa", state: "AL", website: "https://www.ua.edu" },
  { name: "Louisiana State University", city: "Baton Rouge", state: "LA", website: "https://www.lsu.edu" },
  { name: "University of Missouri", city: "Columbia", state: "MO", website: "https://www.missouri.edu" },
  { name: "Oklahoma State University", city: "Stillwater", state: "OK", website: "https://www.okstate.edu" },
  { name: "University of Oklahoma", city: "Norman", state: "OK", website: "https://www.ou.edu" },
  { name: "University of Nebraska", city: "Lincoln", state: "NE", website: "https://www.unl.edu" },
  { name: "University of Kansas", city: "Lawrence", state: "KS", website: "https://www.ku.edu" },
  { name: "University of Arkansas", city: "Fayetteville", state: "AR", website: "https://www.uark.edu" },
  { name: "University of Oregon", city: "Eugene", state: "OR", website: "https://www.uoregon.edu" },
  { name: "Oregon State University", city: "Corvallis", state: "OR", website: "https://oregonstate.edu" },
  { name: "University of Utah", city: "Salt Lake City", state: "UT", website: "https://www.utah.edu" },
  { name: "Brigham Young University", city: "Provo", state: "UT", website: "https://www.byu.edu" },
  { name: "University of Nevada Las Vegas", city: "Las Vegas", state: "NV", website: "https://www.unlv.edu" },
  { name: "University of Maryland", city: "College Park", state: "MD", website: "https://www.umd.edu" },
  { name: "University of Pittsburgh", city: "Pittsburgh", state: "PA", website: "https://www.pitt.edu" },
  { name: "University of Cincinnati", city: "Cincinnati", state: "OH", website: "https://www.uc.edu" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function seed() {
  console.log("🌱 Starting university seed...\n");

  let citiesInserted = 0, citiesExisting = 0;
  let universitiesInserted = 0, universitiesExisting = 0;

  for (const uni of UNIVERSITIES) {
    // Upsert city
    const { data: existingCity } = await supabase
      .from("cities")
      .select("id")
      .eq("name", uni.city)
      .eq("state", uni.state)
      .single();

    let cityId: string;

    if (existingCity) {
      cityId = existingCity.id;
      citiesExisting++;
    } else {
      const { data: newCity, error } = await supabase
        .from("cities")
        .insert({ name: uni.city, state: uni.state, is_active: true })
        .select("id")
        .single();

      if (error || !newCity) {
        console.error(`  ✗ Failed to insert city: ${uni.city}, ${uni.state}`, error?.message);
        continue;
      }
      cityId = newCity.id;
      citiesInserted++;
    }

    // Upsert university
    const slug = slugify(uni.name);
    const { data: existingUni } = await supabase
      .from("universities")
      .select("id")
      .eq("name", uni.name)
      .eq("state", uni.state)
      .single();

    if (existingUni) {
      universitiesExisting++;
      console.log(`  ↻  Already exists: ${uni.name}`);
    } else {
      const { error } = await supabase.from("universities").insert({
        name: uni.name,
        slug,
        city_id: cityId,
        state: uni.state,
        website: uni.website,
        is_active: true,
        source: "admin",
      });

      if (error) {
        console.error(`  ✗ Failed to insert: ${uni.name}`, error.message);
      } else {
        universitiesInserted++;
        console.log(`  ✓  Inserted: ${uni.name}`);
      }
    }
  }

  console.log("\n─────────────────────────────");
  console.log("Seed complete");
  console.log(`Cities:       ${citiesInserted} inserted, ${citiesExisting} already existed`);
  console.log(`Universities: ${universitiesInserted} inserted, ${universitiesExisting} already existed`);
}

seed().catch(console.error);
