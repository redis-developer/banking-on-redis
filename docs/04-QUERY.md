# Using RediSearch #

[RediSearch](https://redis.io/docs/stack/search/) is a module that adds indexing and full-text search to Redis. You can use it to make your Hashes and JSON documents fully searchable. RediSearch is a *really* big topic and would probably be suitable as a workshop all its own. We're just going to cover the basics here so that we can finish up our Bigfoot Tracker API. If you'd like to know more, check out the [full search query syntax](https://redis.io/docs/stack/search/reference/query_syntax/) to see what you can do.

In the next few sections, we'll be using the [FT.CREATE](https://redis.io/commands/ft.create/) to create an index, [FT.SEARCH](https://redis.io/commands/ft.search/) to search, and [FT.DROPINDEX](https://redis.io/commands/ft.dropindex/) to delete an index. We'll also use [FT.INFO](https://redis.io/commands/ft.info/) to get information about our index and [FT._LIST](https://redis.io/commands/ft._list/) to get a list of existing indices.

## Loading Some Data ##

To really show off RediSearch, we need some data. Like, maybe, 4,586 Bigfoot sightings. We have all of those in the **`data/json`** folder but adding them one by one might be a *bit* tedious. So, I wrote a shell script to do it for you.

Make sure your Bigfoot Tracker API is running. Then, in another terminal and in **`data`** folder, just run the `load-sightings.sh` script:

```bash
./load-sightings.sh
```

You should be rewards with a massive list of ULIDs and filenames. Like this:

```bash
./load-sightings.sh
{"id":"01G9HSR74GG3XMMT2T7X80FMVD"} <- json/bigfoot-sighting-10006.json
{"id":"01G9HSR753T26ZDBF8EP4B6YKF"} <- json/bigfoot-sighting-10012.json
{"id":"01G9HSR75HAFAMHB2JTN8YB89R"} <- json/bigfoot-sighting-10024.json
{"id":"01G9HSR75ZKNG5EMZ8QCXR61RG"} <- json/bigfoot-sighting-1003.json
{"id":"01G9HSR76DEQB0X7RK3TJ37K1T"} <- json/bigfoot-sighting-10034.json
{"id":"01G9HSR76TZ7ECDPN0JEZKQN4F"} <- json/bigfoot-sighting-10037.json
{"id":"01G9HSR778PWTJNR9E7A4PX69J"} <- json/bigfoot-sighting-10046.json
{"id":"01G9HSR77PMK0RTW57WVKPVD83"} <- json/bigfoot-sighting-1005.json
...
```

It might take a minute or two to run but when its done, you'll have plenty of Bigfoot sightings to play with.

## Creating Indices ##

Now that we have some data, let's create an index to use it. Take a look at the following command. In fact, go ahead and run it:

```bash
127.0.0.1:6379> FT.CREATE bigfoot:sighting:index
  ON JSON
  PREFIX 1 bigfoot:sighting:
  SCHEMA
    $.title AS title TEXT
    $.observed AS observed TEXT
    $.state AS state TAG
    $.classification AS classification TAG
    $.temperature_mid AS temperature_mid NUMERIC
    $.location AS location GEO
OK
```

This creates an index named `bigfoot:sighting:index`. If you look for this index in your keyspace, you won't find it. But if you use the FT._LIST command, you will. Go ahead and try it:

```bash
127.0.0.1:6379> FT._LIST
1) "bigfoot:sighting:index"
```

Yep. There it is.

Immediately after we specify the name of the index, we can provide the data structure that RediSearch can index. RediSearch can index both JSON documents and Hashes, specified by adding either `ON JSON` or `ON HASH`. If this is not specified, it defaults to `ON HASH`.

After specifying the data structure, we can provide one or more keyspaces for this index to, well, index. Whenever a change in made in this keyspace, our index is updated automatically and atomically with the change. We have specified `PREFIX 1 bigfoot:sighting:` so we'll look at any JSON document that starts with `bigfoot:sighting:`. The `1` tells Redis that we only have one prefix. If we had more, it might look like this:

```
PREFIX 3 bigfoot:sighting: ufo:sighting: ghost:sighting:
```

Then, we specify the schema for the index. This tells RediSearch how to index our data. Each section in the schema tells Redis three things.

The first is the location of the field. This is the JSONPath to the field if we are indexing JSON documents or just the name of the field if we are indexing Hashes.

Next, is an optional alias to use when we search with the index later. With Hashes, this is only mildly useful. But with JSON documents, this allows us to rename something like `$.foo.bar[*].baz` to `baz`.

Third and lastly, we tell Redis the type of data that is stored at that location. Valid types a TEXT, TAG, NUMERIC, and GEO. We'll cover these more later when we search on them.

## Removing Indices ##

If for some reason we don't like our index, we can always remove it using FT.DROPINDEX. Go ahead an remove the index:

```bash
127.0.0.1:6379> FT.DROPINDEX bigfoot:sighting:index
OK
```

A quick check of the indices will confirm it is removed:

```bash
127.0.0.1:6379> FT._LIST
(empty array)
```

And it's gone! Of course, we *want* our index, `cuz we're gonna search against it. So go ahead and recreate it:

```bash
127.0.0.1:6379> FT.CREATE bigfoot:sighting:index
  ON JSON
  PREFIX 1 bigfoot:sighting:
  SCHEMA
    $.title AS title TEXT
    $.observed AS observed TEXT
    $.state AS state TAG
    $.classification AS classification TAG
    $.temperature_mid AS temperature_mid NUMERIC
    $.location AS location GEO
OK
```

## Searching Indices ##

We search our index using the FT.SEARCH command. The simplest of searches is a search for everything. Go ahead and try it out:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index *
 1) (integer) 4586
 2) "bigfoot:sighting:01G9HSS0HBED8CZR84RN32GQ89"
 3) 1) "$"
    2) "{\"id\":\"01G9HSS0HBED8CZR84RN32GQ89\",\"reportId\":\"27167\",\"title\":\"\",\"date\":\"\",\"observed\":\"\",\"classification\":\"Class A\",\"county\":\"Marshall\",\"state\":\"Mississippi\",\"location_details\":\"\",\"summary\":\"\"}"
 4) "bigfoot:sighting:01G9HSRRMTXMX7WDM0S4XS1YAQ"
 5) 1) "$"
    2) "{\"id\":\"01G9HSRRMTXMX7WDM0S4XS1YAQ\",\"reportId\":\"22852\",\"title\":\"\",\"date\":\"\",\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"White\",\"state\":\"Georgia\",\"location_details\":\"[Exact location omitted] on the Appalachian trail\",\"summary\":\"\"}"
 6) "bigfoot:sighting:01G9HSSHBG3X799TKWSWXE128J"
 7) 1) "$"
    2) "{\"id\":\"01G9HSSHBG3X799TKWSWXE128J\",\"reportId\":\"44350\",\"title\":\"\",\"date\":\"\",\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"Jefferson\",\"state\":\"Pennsylvania\",\"location_details\":\"On the night before that I believe the tracks were made, it was heavy snow pack, and there was very lite flurries and a little blowing, over night, with temp somewhere I think -5. The morning when I seen the tracks it was about 7, I believe/remember from TV News.\",\"summary\":\"\"}"
 8) "bigfoot:sighting:01G9HSSAKBP8DJQBFK0A62QVG3"
 9) 1) "$"
    2) "{\"id\":\"01G9HSSAKBP8DJQBFK0A62QVG3\",\"reportId\":\"3629\",\"title\":\"\",\"date\":\"\",\"observed\":\"\",\"classification\":\"Class A\",\"county\":\"Cassia\",\"state\":\"Idaho\",\"location_details\":\"i can take you to the spot that i saw it. it was off the road a ways and the road are just dirt and logging roads. it was walking up a revien when i smelled it\",\"summary\":\"\"}"
10) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
11) 1) "$"
    2) "{\"id\":\"01G9HSRFRAAS9W8MWBXNQ87C2F\",\"reportId\":\"14887\",\"title\":\"Possible sighting, vocalizations, stalking, etc., near Sweetwater Creek\",\"date\":\"2006-07-05\",\"timestamp\":1152057600,\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"Paulding\",\"state\":\"Georgia\",\"latitude\":33.81283,\"longitude\":-84.80283,\"location\":\"-84.80283,33.81283\",\"location_details\":\"From Hwy 92 going south through Hiram, GA, you will come to Ridge Rd.  Turn right at the light. Go a few miles just past a baseball field on the right. Once you pass this it will be the next street (not subdivision) on the left. This is Austin Bridge Rd. Go down about a half mile to a subdivision called Austin Meadows.  (Exact location removed at request of witness.)\",\"temperature_high\":88.91,\"temperature_mid\":80.17,\"temperature_low\":71.43,\"dew_point\":68.41,\"humidity\":0.73,\"cloud_cover\":0.43,\"moon_phase\":0.31,\"precip_intensity\":0.0075,\"precip_probability\":0.48,\"precip_type\":\"rain\",\"pressure\":1015.9,\"summary\":\"Partly cloudy throughout the day.\",\"uv_index\":10,\"visibility\":6.83,\"wind_bearing\":341,\"wind_speed\":1}"
12) "bigfoot:sighting:01G9HSRW2EHRWB2XRH4PT8QV2R"
13) 1) "$"
    2) "{\"id\":\"01G9HSRW2EHRWB2XRH4PT8QV2R\",\"reportId\":\"24646\",\"title\":\"Early morning sighting by a fisherman south of Montgomery\",\"date\":\"2001-04-13\",\"timestamp\":987120000,\"observed\":\"\",\"classification\":\"Class A\",\"county\":\"Lowndes\",\"state\":\"Alabama\",\"latitude\":32.184,\"longitude\":-86.581,\"location\":\"-86.581,32.184\",\"location_details\":\"South of Montgomery , Al near the town of Hayneville at a small fishing club with about 5 pond/ lakes around more details available if interested\",\"temperature_high\":81.87,\"temperature_mid\":71.63,\"temperature_low\":61.39,\"dew_point\":69.41,\"humidity\":0.84,\"cloud_cover\":0.6,\"moon_phase\":0.69,\"precip_intensity\":0.0035,\"precip_probability\":0.84,\"precip_type\":\"rain\",\"pressure\":1018.23,\"summary\":\"Mostly cloudy throughout the day.\",\"uv_index\":7,\"visibility\":8.34,\"wind_bearing\":241,\"wind_speed\":5.99}"
14) "bigfoot:sighting:01G9HSRXK1FG9BNZBP3H7H2X86"
15) 1) "$"
    2) "{\"id\":\"01G9HSRXK1FG9BNZBP3H7H2X86\",\"reportId\":\"25444\",\"title\":\"High school teacher recalls a nighttime sighting while camping in the Los Padres National Forest\",\"date\":\"1982-04-15\",\"timestamp\":387676800,\"observed\":\"\",\"classification\":\"Class A\",\"county\":\"Santa Barbara\",\"state\":\"California\",\"latitude\":34.73389,\"longitude\":-119.9254,\"location\":\"-119.9254,34.73389\",\"location_details\":\"we were near the confluence of the sisquac and manzanita rivers in the wilderness area where access is only made by horseback or on foot; we were on foot.\",\"temperature_high\":62.01,\"temperature_mid\":52.175,\"temperature_low\":42.34,\"dew_point\":42.68,\"humidity\":0.66,\"cloud_cover\":0.2,\"moon_phase\":0.73,\"precip_intensity\":0,\"precip_probability\":0,\"pressure\":1015.82,\"summary\":\"Partly cloudy until afternoon.\",\"uv_index\":9,\"visibility\":9.02,\"wind_bearing\":312,\"wind_speed\":9.55}"
16) "bigfoot:sighting:01G9HSSNGN5QTYGQC40NRS908H"
17) 1) "$"
    2) "{\"id\":\"01G9HSSNGN5QTYGQC40NRS908H\",\"reportId\":\"49621\",\"title\":\"Teen recounts possible encounter while walking in a Lansing city park\",\"date\":\"2015-04-01\",\"timestamp\":1427846400,\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"Ingham\",\"state\":\"Michigan\",\"latitude\":42.75195,\"longitude\":-81.52805,\"location\":\"-81.52805,42.75195\",\"location_details\":\"It happened in Bancroft park in Lansing\",\"temperature_high\":45.33,\"temperature_mid\":40.395,\"temperature_low\":35.46,\"dew_point\":30.78,\"humidity\":0.81,\"cloud_cover\":0.24,\"moon_phase\":0.41,\"precip_intensity\":0,\"precip_probability\":0,\"pressure\":1018.5,\"summary\":\"Partly cloudy until afternoon.\",\"uv_index\":5,\"visibility\":8.33,\"wind_bearing\":135,\"wind_speed\":4.13}"
18) "bigfoot:sighting:01G9HSSDJ4JKDDK9H0YFYWPYJ1"
19) 1) "$"
    2) "{\"id\":\"01G9HSSDJ4JKDDK9H0YFYWPYJ1\",\"reportId\":\"40106\",\"title\":\"Possible daylight sighting by a motorist near Mio.\",\"date\":\"2013-03-12\",\"timestamp\":1363046400,\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"Oscoda\",\"state\":\"Michigan\",\"latitude\":44.68,\"longitude\":-84.01165,\"location\":\"-84.01165,44.68\",\"location_details\":\"Most would immediately say \\\"I can draw it!\\\" The encounter was incredible in broad day ight! There was NO question in my mind with what I had encountered. The significant part of my sighting was I saw this in between an open 6ft. spaced groupings of pine trees.....this creature was alarmed when spotted. Darted. Others claim aggressiveness!? In my situation, this thing couldn't get away fast enough!\",\"temperature_high\":29.44,\"temperature_mid\":24.725,\"temperature_low\":20.01,\"dew_point\":25.22,\"humidity\":0.84,\"cloud_cover\":0.99,\"moon_phase\":0.03,\"precip_intensity\":0.0013,\"precip_probability\":0.38,\"precip_type\":\"snow\",\"pressure\":1006.38,\"summary\":\"Overcast throughout the day.\",\"uv_index\":2,\"visibility\":6.78,\"wind_bearing\":254,\"wind_speed\":9.91}"
20) "bigfoot:sighting:01G9HSRDT6CZZVTDN5KRWXY19N"
21) 1) "$"
    2) "{\"id\":\"01G9HSRDT6CZZVTDN5KRWXY19N\",\"reportId\":\"13613\",\"title\":\"Hikers find footprints, hear sounds, etc., near Leavitt Meadows\",\"date\":\"1980-08-01\",\"timestamp\":333936000,\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"Mono\",\"state\":\"California\",\"latitude\":38.29165,\"longitude\":-119.54,\"location\":\"-119.54,38.29165\",\"location_details\":\"From Leavitt meadows campground: Hike S ~5 mi to Roosevelt & Lane Lakes (connected by narrow stream); At W end of Lane Lake vocalization occurred;  Directly S of Lake is an estabished primitive campsite (area) just E of River & S of Lake. From Campsite Hike SE ~1 mi (past glacier) to top of ridgeline/cliffs to ~1000'+ elev from campsite. \\\"Skunk\\\" odiferous canyon (steep ravine) is just S of Marine Corps Helicopter crash site.\",\"temperature_high\":97.37,\"temperature_mid\":79.465,\"temperature_low\":61.56,\"dew_point\":49.53,\"humidity\":0.33,\"cloud_cover\":0.23,\"moon_phase\":0.68,\"precip_intensity\":0,\"precip_probability\":0,\"pressure\":1012.4,\"summary\":\"Partly cloudy in the morning.\",\"uv_index\":11,\"visibility\":9.91,\"wind_bearing\":296,\"wind_speed\":3.43}"
```

Redis returns a lot of data back. The very first thing is the total number of items that matched out query: 4,586 in our case. After that, you get the keyname followed by the contents of that key. The contents for a Hash would be a series of field names followed by values. But for JSON, the "field name" is just `$` and then "value" is the JSON text.

You might have noticed that we only got 10 results back but we have 4,586 total results. The call to FT.SEARCH has a default limit of `10`. You can override this and paginate the results using the `LIMIT` option. Try just getting five results:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index * LIMIT 0 5
 1) (integer) 4586
 2) "bigfoot:sighting:01G9HSS0HBED8CZR84RN32GQ89"
 3) 1) "$"
    2) "{\"id\":\"01G9HSS0HBED8CZR84RN32GQ89\",\"reportId\":\"27167\",\"title\":\"\",\"date\":\"\",\"observed\":\"\",\"classification\":\"Class A\",\"county\":\"Marshall\",\"state\":\"Mississippi\",\"location_details\":\"\",\"summary\":\"\"}"
 4) "bigfoot:sighting:01G9HSRRMTXMX7WDM0S4XS1YAQ"
 5) 1) "$"
    2) "{\"id\":\"01G9HSRRMTXMX7WDM0S4XS1YAQ\",\"reportId\":\"22852\",\"title\":\"\",\"date\":\"\",\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"White\",\"state\":\"Georgia\",\"location_details\":\"[Exact location omitted] on the Appalachian trail\",\"summary\":\"\"}"
 6) "bigfoot:sighting:01G9HSSHBG3X799TKWSWXE128J"
 7) 1) "$"
    2) "{\"id\":\"01G9HSSHBG3X799TKWSWXE128J\",\"reportId\":\"44350\",\"title\":\"\",\"date\":\"\",\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"Jefferson\",\"state\":\"Pennsylvania\",\"location_details\":\"On the night before that I believe the tracks were made, it was heavy snow pack, and there was very lite flurries and a little blowing, over night, with temp somewhere I think -5. The morning when I seen the tracks it was about 7, I believe/remember from TV News.\",\"summary\":\"\"}"
 8) "bigfoot:sighting:01G9HSSAKBP8DJQBFK0A62QVG3"
 9) 1) "$"
    2) "{\"id\":\"01G9HSSAKBP8DJQBFK0A62QVG3\",\"reportId\":\"3629\",\"title\":\"\",\"date\":\"\",\"observed\":\"\",\"classification\":\"Class A\",\"county\":\"Cassia\",\"state\":\"Idaho\",\"location_details\":\"i can take you to the spot that i saw it. it was off the road a ways and the road are just dirt and logging roads. it was walking up a revien when i smelled it\",\"summary\":\"\"}"
10) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
11) 1) "$"
    2) "{\"id\":\"01G9HSRFRAAS9W8MWBXNQ87C2F\",\"reportId\":\"14887\",\"title\":\"Possible sighting, vocalizations, stalking, etc., near Sweetwater Creek\",\"date\":\"2006-07-05\",\"timestamp\":1152057600,\"observed\":\"\",\"classification\":\"Class B\",\"county\":\"Paulding\",\"state\":\"Georgia\",\"latitude\":33.81283,\"longitude\":-84.80283,\"location\":\"-84.80283,33.81283\",\"location_details\":\"From Hwy 92 going south through Hiram, GA, you will come to Ridge Rd.  Turn right at the light. Go a few miles just past a baseball field on the right. Once you pass this it will be the next street (not subdivision) on the left. This is Austin Bridge Rd. Go down about a half mile to a subdivision called Austin Meadows.  (Exact location removed at request of witness.)\",\"temperature_high\":88.91,\"temperature_mid\":80.17,\"temperature_low\":71.43,\"dew_point\":68.41,\"humidity\":0.73,\"cloud_cover\":0.43,\"moon_phase\":0.31,\"precip_intensity\":0.0075,\"precip_probability\":0.48,\"precip_type\":\"rain\",\"pressure\":1015.9,\"summary\":\"Partly cloudy throughout the day.\",\"uv_index\":10,\"visibility\":6.83,\"wind_bearing\":341,\"wind_speed\":1}"
```

The `LIMIT` option takes a starting point within the results and a total number of results to return. So, to get the fifth result you would enter:

```bash
FT.SEARCH bigfoot:sighting:index * LIMIT 4 1
```

If you tell limit to return zero items, you will get only the count of items that match your query:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index * LIMIT 0 0
1) (integer) 4586
```

You can also specify what fields you want returned with the `RETURN` option:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index * RETURN 2 $.id $.title
 1) (integer) 4586
 2) "bigfoot:sighting:01G9HSS0HBED8CZR84RN32GQ89"
 3) 1) "$.id"
    2) "01G9HSS0HBED8CZR84RN32GQ89"
    3) "$.title"
    4) ""
 4) "bigfoot:sighting:01G9HSRRMTXMX7WDM0S4XS1YAQ"
 5) 1) "$.id"
    2) "01G9HSRRMTXMX7WDM0S4XS1YAQ"
    3) "$.title"
    4) ""
 6) "bigfoot:sighting:01G9HSSHBG3X799TKWSWXE128J"
 7) 1) "$.id"
    2) "01G9HSSHBG3X799TKWSWXE128J"
    3) "$.title"
    4) ""
 8) "bigfoot:sighting:01G9HSSAKBP8DJQBFK0A62QVG3"
 9) 1) "$.id"
    2) "01G9HSSAKBP8DJQBFK0A62QVG3"
    3) "$.title"
    4) ""
10) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
11) 1) "$.id"
    2) "01G9HSRFRAAS9W8MWBXNQ87C2F"
    3) "$.title"
    4) "Possible sighting, vocalizations, stalking, etc., near Sweetwater Creek"
12) "bigfoot:sighting:01G9HSRW2EHRWB2XRH4PT8QV2R"
13) 1) "$.id"
    2) "01G9HSRW2EHRWB2XRH4PT8QV2R"
    3) "$.title"
    4) "Early morning sighting by a fisherman south of Montgomery"
14) "bigfoot:sighting:01G9HSRXK1FG9BNZBP3H7H2X86"
15) 1) "$.id"
    2) "01G9HSRXK1FG9BNZBP3H7H2X86"
    3) "$.title"
    4) "High school teacher recalls a nighttime sighting while camping in the Los Padres National Forest"
16) "bigfoot:sighting:01G9HSSNGN5QTYGQC40NRS908H"
17) 1) "$.id"
    2) "01G9HSSNGN5QTYGQC40NRS908H"
    3) "$.title"
    4) "Teen recounts possible encounter while walking in a Lansing city park"
18) "bigfoot:sighting:01G9HSSDJ4JKDDK9H0YFYWPYJ1"
19) 1) "$.id"
    2) "01G9HSSDJ4JKDDK9H0YFYWPYJ1"
    3) "$.title"
    4) "Possible daylight sighting by a motorist near Mio."
20) "bigfoot:sighting:01G9HSRDT6CZZVTDN5KRWXY19N"
21) 1) "$.id"
    2) "01G9HSRDT6CZZVTDN5KRWXY19N"
    3) "$.title"
    4) "Hikers find footprints, hear sounds, etc., near Leavitt Meadows"
```

The `2` in the above command is similar to the number in the `PREFIX` option of `FT.CREATE`—it tells Redis how many arguments to expect. Interestingly, you can tell Redis to return `0` fields.

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index * RETURN 0
 1) (integer) 4586
 2) "bigfoot:sighting:01G9HSS0HBED8CZR84RN32GQ89"
 3) "bigfoot:sighting:01G9HSRRMTXMX7WDM0S4XS1YAQ"
 4) "bigfoot:sighting:01G9HSSHBG3X799TKWSWXE128J"
 5) "bigfoot:sighting:01G9HSSAKBP8DJQBFK0A62QVG3"
 6) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
 7) "bigfoot:sighting:01G9HSRW2EHRWB2XRH4PT8QV2R"
 8) "bigfoot:sighting:01G9HSRXK1FG9BNZBP3H7H2X86"
 9) "bigfoot:sighting:01G9HSSNGN5QTYGQC40NRS908H"
10) "bigfoot:sighting:01G9HSSDJ4JKDDK9H0YFYWPYJ1"
11) "bigfoot:sighting:01G9HSRDT6CZZVTDN5KRWXY19N"
```

When you do this, you just get the key names back.

----------------------------------------

That's the basics of the basics. Now, let's see [how to search on common field types](17-REDISEARCH-TEXT-AND-TAG.md).







# Searching TEXT and TAG Fields ##

TEXT and TAG fields together allow you to perform most of the types of searches against strings that you'd want to do. TEXT fields provide full-text search so you can find words within blocks of texts. Tags act as keys or collections of keys that match on an entire value.

## Searching TEXT Fields ##

A TEXT field in Redis search indicates a field that contains human-readable text that we want to perform full-text search against. TEXT fields understand related words using a process called *stemming*. So RediSearch knows that a search for `give` should match text with `gives`, `gave`, `given`, and `giving`. TEXT fields also know that certain words—called *stopwords*—are common and not useful for search. Thus, words like `a`, `and`, and `the` are ignored when searching TEXT fields.

By default, RediSearch will search all text fields in the index. Let's find some Bigfoot sightings with the word `creek` in any TEXT field:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index creek RETURN 0
 1) (integer) 669
 2) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
 3) "bigfoot:sighting:01G9HSRTGFYST26ZEY3JEM6ZT9"
 4) "bigfoot:sighting:01G9HSRR815TDYDF9CG69N2GE8"
 5) "bigfoot:sighting:01G9HSSAJXCAYBJJBXDFFAKM35"
 6) "bigfoot:sighting:01G9HSR97XJF0ZFDN89DRBMYVD"
 7) "bigfoot:sighting:01G9HSRYA6956XAE123A3N1YMY"
 8) "bigfoot:sighting:01G9HSS66A0DY4JB8M2CPWYXDP"
 9) "bigfoot:sighting:01G9HSS3D21Y5BF6V32HTN1TW7"
10) "bigfoot:sighting:01G9HSSJ5DBT3XYPGBYSNHW36H"
11) "bigfoot:sighting:01G9HSRNQ0E24FF71C243NA4NQ"
```

Looks like we got quite a few. Turns out there are a lot of creeks in the woods.

To search a specific field, prefix it with the field name. Let's look for Bigfoot sightings with the word `creek` in the `title`:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index @title:creek RETURN 0
 1) (integer) 105
 2) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
 3) "bigfoot:sighting:01G9HSR97XJF0ZFDN89DRBMYVD"
 4) "bigfoot:sighting:01G9HSRYA6956XAE123A3N1YMY"
 5) "bigfoot:sighting:01G9HSS66A0DY4JB8M2CPWYXDP"
 6) "bigfoot:sighting:01G9HST2ERPCMGVVSCY429NFVP"
 7) "bigfoot:sighting:01G9HSSVG2H0H6G3302ESHQFNG"
 8) "bigfoot:sighting:01G9HSSBEK06GD4FR29NH37R4Q"
 9) "bigfoot:sighting:01G9HST1M99BN2VDH27RDT3AJV"
10) "bigfoot:sighting:01G9HSRPA24RMQAF0X5D2KQPFJ"
11) "bigfoot:sighting:01G9HSSBDRCTD3WW8NYT6TC8GT"
```

So far, our queries haven't used quotes. But it's usually needed for anything beyond the most basic searches. Let's search for Bigfoot sightings with the word `creek` in the `title` and `woods` in the `observed`:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@title:creek @observed:woods" RETURN 0
 1) (integer) 45
 2) "bigfoot:sighting:01G9HSS32Y030EMK2AHGTG97TF"
 3) "bigfoot:sighting:01G9HSS66A0DY4JB8M2CPWYXDP"
 4) "bigfoot:sighting:01G9HSSD068FVBEDCEKAR90E11"
 5) "bigfoot:sighting:01G9HSRAMMNVR7212JGAC9S4AK"
 6) "bigfoot:sighting:01G9HSRN4NVY2AYHGH194M53ZN"
 7) "bigfoot:sighting:01G9HSSNMEVB4BGJH1M03BME75"
 8) "bigfoot:sighting:01G9HSS28YME96PQGCQT24CY7H"
 9) "bigfoot:sighting:01G9HST2ERPCMGVVSCY429NFVP"
10) "bigfoot:sighting:01G9HSSG2E9RTH7B8676595N76"
11) "bigfoot:sighting:01G9HSS67ZGGS7ANYAGZK7DZTQ"
```

## Searching TAG Fields ##

TAG fields represent a single string or a collection of strings. They are stored in Hashes and JSON as comma-delimited strings like:

```
Ohio,West Virginia,Kentucky
```

In JSON, they can also be stored as any JSONPath that would return an array of strings. For example, look at the following JSON:

```json
{
  "reportId": "1234",
  "counties": [
    {
      "county": "Athens",
      "state": "Ohio"
    },
    {
      "county": "Boone",
      "state": "West Virginia"
    },
    {
      "county": "Flemming ",
      "state": "Kentucky"
    }
  ]
}
```

You could create a TAG field with a JSONPath of `$.bigfootState[*].state`.

You can think of TAGs as the tags clouds on a blog. You can search for JSON documents and Hashes that contain a specific value within that TAG. So, you could search for `Ohio` and any document tagged with `Ohio` will be returned.

If you provide only a single values in a TAG, it can make an excellent key—foreign or primary. In the above JSON, you can specify a TAG field for the `reportId` property with a JSONPath of `$.reportId`.

You can search on a TAG field using the following syntax:

```bash
FT.SEARCH bigfoot:sighting:index "@state:{Ohio}" RETURN 0
 1) (integer) 257
 2) "bigfoot:sighting:01G9HSSNN8XM2QBJF1P0P6NFZQ"
 3) "bigfoot:sighting:01G9HSRTZ55Z55Q69R2DG9DWAF"
 4) "bigfoot:sighting:01G9HSSP8WHJRCZQ4Z270CS36V"
 5) "bigfoot:sighting:01G9HSRJ1B454H8S1HPFAEW5V0"
 6) "bigfoot:sighting:01G9HSSBQKKVPP7CYZMXXARM41"
 7) "bigfoot:sighting:01G9HSSGAYRG295WPR7TYWNVN3"
 8) "bigfoot:sighting:01G9HSSNSGAJ8SNK7R6S1WJ9CA"
 9) "bigfoot:sighting:01G9HSSG97AVJ9R1TB9X9TKC2Q"
10) "bigfoot:sighting:01G9HSSJD1GHYYMTMDFJEWW0AD"
11) "bigfoot:sighting:01G9HSSNFTE9W8MQ3EVTHPSY6J"
```

If you want to search on TAGs that contain whitespace, be sure to escape it with backslashes:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@state:{West\\ Virginia}" RETURN 0
 1) (integer) 99
 2) "bigfoot:sighting:01G9HSS511R305GDJG3NBAJD57"
 3) "bigfoot:sighting:01G9HSRAXN7560P70XYFQTC0DR"
 4) "bigfoot:sighting:01G9HSSFDKPG3XW1C7ZD44XYEV"
 5) "bigfoot:sighting:01G9HSRAYE6JVDE1BF87VBNRJ8"
 6) "bigfoot:sighting:01G9HSSY7V9C2GJE2ZA3YYN8QW"
 7) "bigfoot:sighting:01G9HSRATT7PKKMHCDMA5K9G6G"
 8) "bigfoot:sighting:01G9HSRAX8RHJT94FRMXGQ2AEZ"
 9) "bigfoot:sighting:01G9HSRWTY6YZHJSJWGYZ2MPZB"
10) "bigfoot:sighting:01G9HSRCD3JN3ZJP64Z5TW208X"
11) "bigfoot:sighting:01G9HSS0RWA4QC6B084FT5V9TJ"
```

You can search on documents tagged with one value *or* another with a `|`:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@state:{Ohio|Kentucky}" RETURN 0
 1) (integer) 365
 2) "bigfoot:sighting:01G9HSSHXK5ARH3PMSDW79MVXT"
 3) "bigfoot:sighting:01G9HSSCQDZ03NQY6RCDT21BZ1"
 4) "bigfoot:sighting:01G9HSSNN8XM2QBJF1P0P6NFZQ"
 5) "bigfoot:sighting:01G9HSRTZ55Z55Q69R2DG9DWAF"
 6) "bigfoot:sighting:01G9HSSP8WHJRCZQ4Z270CS36V"
 7) "bigfoot:sighting:01G9HSRJ1B454H8S1HPFAEW5V0"
 8) "bigfoot:sighting:01G9HSSK5Y1JJRBM8P67P305C2"
 9) "bigfoot:sighting:01G9HSRS8D4EAS1264WG615WJY"
10) "bigfoot:sighting:01G9HSSBQKKVPP7CYZMXXARM41"
11) "bigfoot:sighting:01G9HSSGAYRG295WPR7TYWNVN3"
```

You can search on documents tagged with one value *and* another by specifying the same field twice:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@state:{Ohio} @state:{Kentucky}" RETURN 0
1) (integer) 0
```

Of course, Bigfoot sightings happen only in a single state so this returns zero results.

Let's find all the Bigfoot sightings in Ohio that are Class A:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@state:{Ohio} @classification:{Class\\ A}" RETURN 0
 1) (integer) 139
 2) "bigfoot:sighting:01G9HSRTZ55Z55Q69R2DG9DWAF"
 3) "bigfoot:sighting:01G9HSSP8WHJRCZQ4Z270CS36V"
 4) "bigfoot:sighting:01G9HSRJ1B454H8S1HPFAEW5V0"
 5) "bigfoot:sighting:01G9HSSG97AVJ9R1TB9X9TKC2Q"
 6) "bigfoot:sighting:01G9HSSJD1GHYYMTMDFJEWW0AD"
 7) "bigfoot:sighting:01G9HSRY4P8YXBDWS7CJ2ZWQPN"
 8) "bigfoot:sighting:01G9HSSKA7G2E41Y311F7VTCFP"
 9) "bigfoot:sighting:01G9HSSK82V5TQWX2JJ3F5XRWX"
10) "bigfoot:sighting:01G9HSSB9Z4ZG18X644S696QB1"
11) "bigfoot:sighting:01G9HSS146MK9STPD9QGDAB5VS"
```

Note that TAG fields that contain stopwords result in invalid queries. Escaping the string here keeps the parser from seeing the `A` in `Class A` as a stopword.

----------------------------------------

Now that we have searched TEXT and TAG fields, let's [search on NUMERIC and GEO](18-REDISEARCH-NUMERIC-AND-GEO.md) fields.




# Searching NUMERIC and GEO Fields ##

NUMERIC and GEO fields don't have a ton in common, other than they are both simpler than TEXT and TAG searches. So, I've lumped 'em together.

## Searching NUMERIC Fields ##

NUMERIC fields, unsurprisingly, contain numbers. This can be integers of floating-point numbers. If we have indexed JSON documents, these can be actual numbers in the JSON. If we are working with Hashes, these are Strings that contain numbers. Remember, in Redis that Strings that contain numbers are stored as numbers internally. So, NUMERIC fields are actual numbers.

Searching NUMERIC fields in RediSearch is pretty easy. Just provide the upper and lower bounds for the number range you want for a particular field. For example, to find all the temperatures between 75° and 90° inclusive, we would issue the following query:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@temperature_mid:[75 90]" RETURN 1 $.temperature_mid
 1) (integer) 639
 2) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
 3) 1) "$.temperature_mid"
    2) "80.17"
 4) "bigfoot:sighting:01G9HSRDT6CZZVTDN5KRWXY19N"
 5) 1) "$.temperature_mid"
    2) "79.465"
 6) "bigfoot:sighting:01G9HSS7R7R040KJCHJKQ9AP66"
 7) 1) "$.temperature_mid"
    2) "78.935"
 8) "bigfoot:sighting:01G9HSS53ZGTWWVF2QSEKT53D6"
 9) 1) "$.temperature_mid"
    2) "75.55"
10) "bigfoot:sighting:01G9HSSRGGKH7SYV3K2GACKMJD"
11) 1) "$.temperature_mid"
    2) "75.91"
12) "bigfoot:sighting:01G9HSSFNZQCSJ9ZWXD0XF0287"
13) 1) "$.temperature_mid"
    2) "79.77"
14) "bigfoot:sighting:01G9HSSN1GAPCGQMAHYP0R0CA3"
15) 1) "$.temperature_mid"
    2) "77.13"
16) "bigfoot:sighting:01G9HSSP4PEGYBRV6E2SAH3Z5C"
17) 1) "$.temperature_mid"
    2) "78.59"
18) "bigfoot:sighting:01G9HSRHWMA35BJGGW3CWEDS1K"
19) 1) "$.temperature_mid"
    2) "83.545"
20) "bigfoot:sighting:01G9HSS5H0WC7DZ7WFRJ5RBK56"
21) 1) "$.temperature_mid"
    2) "83.36"
```

To make it *exclusive* instead of inclusive:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@temperature_mid:[(75 (90]" RETURN 1 $.temperature_mid
 1) (integer) 639
 2) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
 3) 1) "$.temperature_mid"
    2) "80.17"
 4) "bigfoot:sighting:01G9HSRDT6CZZVTDN5KRWXY19N"
 5) 1) "$.temperature_mid"
    2) "79.465"
 6) "bigfoot:sighting:01G9HSS7R7R040KJCHJKQ9AP66"
 7) 1) "$.temperature_mid"
    2) "78.935"
 8) "bigfoot:sighting:01G9HSS53ZGTWWVF2QSEKT53D6"
 9) 1) "$.temperature_mid"
    2) "75.55"
10) "bigfoot:sighting:01G9HSSRGGKH7SYV3K2GACKMJD"
11) 1) "$.temperature_mid"
    2) "75.91"
12) "bigfoot:sighting:01G9HSSFNZQCSJ9ZWXD0XF0287"
13) 1) "$.temperature_mid"
    2) "79.77"
14) "bigfoot:sighting:01G9HSSN1GAPCGQMAHYP0R0CA3"
15) 1) "$.temperature_mid"
    2) "77.13"
16) "bigfoot:sighting:01G9HSSP4PEGYBRV6E2SAH3Z5C"
17) 1) "$.temperature_mid"
    2) "78.59"
18) "bigfoot:sighting:01G9HSRHWMA35BJGGW3CWEDS1K"
19) 1) "$.temperature_mid"
    2) "83.545"
20) "bigfoot:sighting:01G9HSS5H0WC7DZ7WFRJ5RBK56"
21) 1) "$.temperature_mid"
    2) "83.36"
```

Not much of a change. In fact, looks identical. Try poking around with the query and see if you can prove to yourself that this works.

If you want to remove the upper limit, you can use `+inf` instead of a number:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@temperature_mid:[90 +inf]" RETURN 1 $.temperature_mid
 1) (integer) 5
 2) "bigfoot:sighting:01G9HSS5J8B1Z2Q1C8VM0PN07V"
 3) 1) "$.temperature_mid"
    2) "94.69"
 4) "bigfoot:sighting:01G9HSRS1A0AVCFB62K4NQVYG1"
 5) 1) "$.temperature_mid"
    2) "93.175"
 6) "bigfoot:sighting:01G9HSSRKEDZ5WM0ZXFMSR60KF"
 7) 1) "$.temperature_mid"
    2) "90.285"
 8) "bigfoot:sighting:01G9HSS810YT674CHQ9A09D9AS"
 9) 1) "$.temperature_mid"
    2) "90.55"
10) "bigfoot:sighting:01G9HSSFVBX0FFCAK4RG61MK42"
11) 1) "$.temperature_mid"
    2) "93.98"
```

Not a lot of Bigfoot sightings at or above 90°. Guess he does have a lot of fur. If you want to remove the lower limit, you can use `-inf` in a similar way:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@temperature_mid:[-inf 32]" RETURN 1 $.temperature_mid
 1) (integer) 186
 2) "bigfoot:sighting:01G9HSSDJ4JKDDK9H0YFYWPYJ1"
 3) 1) "$.temperature_mid"
    2) "24.725"
 4) "bigfoot:sighting:01G9HSSZGB9NFTC1NGXM9VVCZH"
 5) 1) "$.temperature_mid"
    2) "26.02"
 6) "bigfoot:sighting:01G9HSSP8WHJRCZQ4Z270CS36V"
 7) 1) "$.temperature_mid"
    2) "14.635"
 8) "bigfoot:sighting:01G9HSS260VJAE3BHGJ7E5T25V"
 9) 1) "$.temperature_mid"
    2) "23.7"
10) "bigfoot:sighting:01G9HSSDPHYCVQR0X9CJBSXK7W"
11) 1) "$.temperature_mid"
    2) "25.655"
12) "bigfoot:sighting:01G9HSSZAVMMXN2XFECA4HE1CQ"
13) 1) "$.temperature_mid"
    2) "24.38"
14) "bigfoot:sighting:01G9HSRD8W8E3PXVTNBG741022"
15) 1) "$.temperature_mid"
    2) "28.735"
16) "bigfoot:sighting:01G9HSS7TQZ0Y2W1YE5MEWD9MC"
17) 1) "$.temperature_mid"
    2) "30.42"
18) "bigfoot:sighting:01G9HSSJD1GHYYMTMDFJEWW0AD"
19) 1) "$.temperature_mid"
    2) "10.495"
20) "bigfoot:sighting:01G9HSRBEE27TEGEAFS0N50E4D"
21) 1) "$.temperature_mid"
    2) "23.865"
```

Quite a few more at or below freezing. And, if you really want to, you can specify `-inf` and `+inf` in the same query. This pretty much just makes sure that the temperature is a number and will filter out things that are null or non-numeric:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@temperature_mid:[-inf +inf]" RETURN 0 LIMIT 0 0
1) (integer) 3645
```

You can see here that there are 3,645 Bigfoot sightings with a temperature. But we know that we have a total of 4,586 Bigfoot sightings:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index * RETURN 0 LIMIT 0 0
1) (integer) 4586
```

And that's pretty much everything with NUMERIC fields.

## Searching GEO Fields ##

GEO fields contain a longitude and a latitude. But, in order for RediSearch to properly index them, they must be in a very specific format. That format is `<longitude>,<latitude>`. Many people, people like me, tend to think latitude and then longitude. Redis doesn't. Take a look at some of the GEO fields with a quick search to see how this formatting looks:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index * RETURN 1 $.location
 1) (integer) 4586
 2) "bigfoot:sighting:01G9HSS0HBED8CZR84RN32GQ89"
 3) (empty array)
 4) "bigfoot:sighting:01G9HSRRMTXMX7WDM0S4XS1YAQ"
 5) (empty array)
 6) "bigfoot:sighting:01G9HSSHBG3X799TKWSWXE128J"
 7) (empty array)
 8) "bigfoot:sighting:01G9HSSAKBP8DJQBFK0A62QVG3"
 9) (empty array)
10) "bigfoot:sighting:01G9HSRFRAAS9W8MWBXNQ87C2F"
11) 1) "$.location"
    2) "-84.80283,33.81283"
12) "bigfoot:sighting:01G9HSRW2EHRWB2XRH4PT8QV2R"
13) 1) "$.location"
    2) "-86.581,32.184"
14) "bigfoot:sighting:01G9HSRXK1FG9BNZBP3H7H2X86"
15) 1) "$.location"
    2) "-119.9254,34.73389"
16) "bigfoot:sighting:01G9HSSNGN5QTYGQC40NRS908H"
17) 1) "$.location"
    2) "-81.52805,42.75195"
18) "bigfoot:sighting:01G9HSSDJ4JKDDK9H0YFYWPYJ1"
19) 1) "$.location"
    2) "-84.01165,44.68"
20) "bigfoot:sighting:01G9HSRDT6CZZVTDN5KRWXY19N"
21) 1) "$.location"
    2) "-119.54,38.29165"
```

Not all of the Bigfoot sightings have locations, but those that do are in `<longitude>,<latitude>` format. It's worth noting that beyond a certain degree of precision, RediSearch will no longer parse a coordinate. So, don't try to cram 14 decimals worth of precision into your coordinates. Anything more than 6 decimals (~10cm) is [probably pointless](https://en.wikipedia.org/wiki/Decimal_degrees) for your application.

To search a GEO field, we need to specify a longitude, a latitude, a radius, and a unit of measure for the radius. This finds all the Bigfoot sightings with 50 miles of Cincinati:

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@location:[-84.5125 39.1 50 mi]" RETURN 1 $.location
 1) (integer) 21
 2) "bigfoot:sighting:01G9HSSJ5DBT3XYPGBYSNHW36H"
 3) 1) "$.location"
    2) "-84.51192,39.65625"
 4) "bigfoot:sighting:01G9HSSKA7G2E41Y311F7VTCFP"
 5) 1) "$.location"
    2) "-84.80138,39.37215"
 6) "bigfoot:sighting:01G9HSSK82V5TQWX2JJ3F5XRWX"
 7) 1) "$.location"
    2) "-84.17227,39.13595"
 8) "bigfoot:sighting:01G9HSRYSBJFR0H1MCS84ERCAC"
 9) 1) "$.location"
    2) "-84.1317,39.03501"
10) "bigfoot:sighting:01G9HSSBSP791RF4BBP6R8BWAN"
11) 1) "$.location"
    2) "-84.63702,38.73854"
12) "bigfoot:sighting:01G9HSSK6CZMA3MNT466BA5040"
13) 1) "$.location"
    2) "-84.79429,39.37509"
14) "bigfoot:sighting:01G9HSSNPZ4BP4VG7NS0VRM26B"
15) 1) "$.location"
    2) "-84.14354,39.00175"
16) "bigfoot:sighting:01G9HSRYDYA15WY064YSH03GZ4"
17) 1) "$.location"
    2) "-83.80582,38.81772"
18) "bigfoot:sighting:01G9HSRWGGN7GEFR94NTX9A320"
19) 1) "$.location"
    2) "-84.67017,38.90649"
20) "bigfoot:sighting:01G9HSRV4XGGKP0RWP94FF8GWN"
21) 1) "$.location"
    2) "-83.80266,38.63454"
```

Valid units of measure are `m`, `km`, `mi`, and `ft`. I like the freedom units but you do you.

```bash
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@location:[-84.5125 39.1 50 m]" RETURN 0 LIMIT 0 0
1) (integer) 0
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@location:[-84.5125 39.1 50 ft]" RETURN 0 LIMIT 0 0
1) (integer) 0
127.0.0.1:6379> FT.SEARCH bigfoot:sighting:index "@location:[-84.5125 39.1 50 km]" RETURN 0 LIMIT 0 0
1) (integer) 12
```

And that's GEO.

----------------------------------------

Search covered, let's see about making our Bigfoot Tracking API take advantage of [RediSearch from Node Redis](19-NODE-REDIS-SEARCH.md) to get rid of that call to `.keys()` and to complete our API!




