# CRYSTAL
## Logging Events
Each log is sent with a number of fields required by [simplelog](https://github.com/fielddaylab/simplelog). Simple log allows for a custom field called event_data_complex along with its category enumerator:
  event_custom: category enumerator
  event_data_complex: JSON.stringify(log_data)
Each log_data is a JSON object for that specific category as defined below.
Note: Note: event_custom will always map to a string of the event name. For example, if an event called FOO had a field of "event_custom", its value would be a string "FOO". Not all events have this field.

### Game Notes:
- The game has 9 levels, refered to in the logs as 0-8.
- Each level involves putting atoms in a crystaline formation. Fill the box to complete the level (The box does not need to be completely filled).
- The player gets a stability score for each level. Different score threshholds are required for different amount of stars.
- Stars are collected to unlock gems in the museum and more levels.
- Later levels (lvl4+) have atoms that have charge, which give more or less stability depending on how they are placed.
- Stability is calculated by adding charge (stability due to charge) + pack (stability given by filling squares in the box).

#### Certain numbers of starts are required for each level.
| Level | Number of Stars Required |
| --- | --- |
|1 | available from start|
|2 | |
|3 | |
|4 | |
|5 | |
|6 | |
|7 | 13|
|8 | 15|
|9 | 16|


#### Change Log
Versions:
1. Original Version
1. Added return to menu log (7/25/2019)
1. Simple log now sends player_id (if present) from the URL to log.php (9/24/2019)

### Event Categories
- [COMPLETE](#COMPLETE)
- [BEGIN](#BEGIN)
- [MOLECULE_RELEASE](#MOLECULE_RELEASE)
- [MOLECULE_ROTATE](#MOLECULE_ROTATE)
- [CLEAR_BTN_PRESS](#CLEAR_BTN_PRESS)
- [QUESTION_ANSWER](#QUESTION_ANSWER)
- [MUSEUM_CLOSE](#MUSEUM_CLOSE)
- [BACK_TO_MENU](#BACK_TO_MENU)

<a name="COMPLETE"/>

#### COMPLETE
Occurs when player completes a level.

| event Name | Description | Note |
| --- | --- | --- |
|0 |int | number of stars achieved in level 1|
|1 |int | number of stars achieved in level 2|
|2 |int | number of stars achieved in level 3|
|3 |int | number of stars achieved in level 4|
|4 |int | number of stars achieved in level 5|
|5 |int | number of stars achieved in level 6|
|6 |int | number of stars achieved in level 7|
|7 |int | number of stars achieved in level 8|
|8 |int | number of stars achieved in level 9|
|stability |{'pack': 'int', 'charge': 'int'} | See game notes. |




<a name="BEGIN"/>

#### BEGIN
Occurs when player starts a level.

| event Name | Description | Note |
| --- | --- | --- |
|stars_0 |int | number of stars achieved in level 1|
|stars_1 |int | number of stars achieved in level 2|
|stars_2 |int | number of stars achieved in level 3|
|stars_3 |int | number of stars achieved in level 4|
|stars_4 |int | number of stars achieved in level 5|
|stars_5 |int | number of stars achieved in level 6|
|stars_6 |int | number of stars achieved in level 7|
|stars_7 |int | number of stars achieved in level 7|
|stars_8 |int | number of stars achieved in level 8|




<a name="MOLECULE_RELEASE"/>

#### MOLECULE_RELEASE


| event Name | Description | Note |
| --- | --- | --- |
|event_custom | string | always "MOLECULE_RELEASE" |
|startPosition |Object of subobjects. Suboject name is coord_n where n is an integer starting at 0. Suboject values are x and y coordinates. Example: {'coord_0': {'x': 'int', 'y': 'int'}, 'coord_1': {'x': 'int', 'y': 'int'}, 'coord_2': {'x': 'int', 'y': 'int'}} | may be more coords, not sure if upper limit exists |
|endPosition  |Object of subobjects. Suboject name is coord_n where n is an integer starting at 0. Suboject values are x and y coordinates. Example: {'coord_0': {'x': 'int', 'y': 'int'}, 'coord_1': {'x': 'int', 'y': 'int'}, 'coord_2': {'x': 'int', 'y': 'int'}} | may be more coords, not sure if upper limit exists |
|time |float | |
|startStability |{'pack': 'int', 'charge': 'int'} | |
|endStability |{'pack': 'int', 'charge': 'int'} | |




<a name="MOLECULE_ROTATE"/>

#### MOLECULE_ROTATE
| event Name | Description | Note |
| --- | --- | --- |
|event_custom |string | |
|isStamp |bool | |
|startRotation |int | |
|endRotation |int | |
|numRotations |int | |
|startStability |{'pack': 'int', 'charge': 'int'} | |
|endStability |{'pack': 'int', 'charge': 'int'} | |




<a name="CLEAR_BTN_PRESS"/>

#### CLEAR_BTN_PRESS
| event Name | Description | Note |
| --- | --- | --- |
|event_custom |string | |
|numTimesPressed |int | |
|numMolecules |int | |
|stability |{'pack': 'int', 'charge': 'int'} | |




<a name="QUESTION_ANSWER"/>

#### QUESTION_ANSWER
| event Name | Description | Note |
| --- | --- | --- |
|event_custom |string | |
|answer |int | |
|answered |int | |
|question |int | |




<a name="MUSEUM_CLOSE"/>

#### MUSEUM_CLOSE
| event Name | Description | Note |
| --- | --- | --- |
|event_custom |string | |
|timeOpen |float | |




<a name="BACK_TO_MENU"/>

#### BACK_TO_MENU
| event Name | Description | Note |
| --- | --- | --- |
|event_custom | string | |


