-- OPTIONAL prototype import. These historical records are UNVERIFIED DRAFTS.
-- No personal records or published listings are seeded. Review every field and upload photography before publishing.
insert into public.properties(slug,address,location,neighborhood,property_type,price,beds,baths,sqft,illustration,listing_status,published) values
('6916-westridge-road','6916 Westridge Road','Little Rock, AR 72223','Chenal','Estate home',1395000,5,5,6777,'stone','For Sale',false),
('31-la-scala-court','31 La Scala Court','Little Rock, AR 72212','Pleasant Valley','Single-family',899900,3,3,3550,'stucco','For Sale',false),
('277-pleasant-valley-drive','277 Pleasant Valley Drive','Little Rock, AR 72212','Pleasant Valley','Single-family',750000,4,4,3400,'brick','Pending',false),
('69-valley-estates-cove','69 Valley Estates Cove','Little Rock, AR 72212','Pleasant Valley','Single-family',749900,5,5,5900,'columns','For Sale',false),
('301-valley-club-circle','301 Valley Club Circle','Little Rock, AR 72212','Pleasant Valley','Single-family',679900,4,4,3370,'brick','For Sale',false),
('1820-main-street','1820 Main Street','Little Rock, AR 72206','Historic Downtown','Historic home',675000,5,3,4583,'porch','For Sale',false),
('16-robinwood-drive','16 Robinwood Drive','Little Rock, AR 72227','Beyond Little Rock','Ranch',565000,4,3,3248,'ranch','Pending',false),
('15-el-dorado-drive','15 El Dorado Drive','Little Rock, AR 72212','Pleasant Valley','Single-family',499900,4,3,3176,'stucco','For Sale',false),
('315-rock-street-unit-1706','315 Rock Street, Unit 1706','Little Rock, AR 72202','Historic Downtown','Condo',400000,2,2,1362,'tower','Pending',false),
('2311-s-louisiana-street','2311 S Louisiana Street','Little Rock, AR 72206','Historic Downtown','Historic home',330000,3,3,2240,'porch','For Sale',false),
('14112-john-branch-road','14112 John Branch Road','Scott, AR 72142','Beyond Little Rock','Ranch',279000,3,2,1634,'ranch','Pending',false),
('25-wolfsbridge-loop','25 Wolfsbridge Loop','Little Rock, AR 72227','Beyond Little Rock','Single-family',260000,3,3,1497,'stucco','Pending',false),
('3-shaun-road','3 Shaun Road','Mayflower, AR 72106','Beyond Little Rock','Ranch',232500,3,2,1565,'ranch','For Sale',false),
('38-chalet-street','38 Chalet Street','Cabot, AR 72023','Beyond Little Rock','Ranch',192000,3,2,1211,'ranch','For Sale',false),
('lot-152-woodlawn-drive','Lot 152 Woodlawn Drive','Fairfield Bay, AR 72088','Beyond Little Rock','Land',4000,0,0,0,'lot','For Sale',false),
('lot-86-lynn-creek-drive','Lot 86 Lynn Creek Drive','Fairfield Bay, AR 72088','Beyond Little Rock','Land',4000,0,0,0,'lot','For Sale',false)
on conflict(slug) do nothing;
