# CRYSTAL
## Logging Events
Each log is sent with a number of fields required by [simplelog](https://github.com/fielddaylab/simplelog). Simple log allows for a custom field called event_data_complex along with its category enumerator:
  event_custom: category enumerator
  event_data_complex: JSON.stringify(log_data)
Each log_data is a JSON object for that specific category as defined below.
Note: Note: event_custom will always map to a string of the event name. For example, if an event called FOO had a field of "event_custom", its value would be a string "FOO". Not all events have this field.

#### Change Log
Versions:
1. Original Version

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
| event Name | Description | Note |
| --- | --- | --- |
|0 |int | |
|1 |int | |
|2 |int | |
|3 |int | |
|4 |int | |
|5 |int | |
|6 |int | |
|7 |int | |
|8 |int | |
|stability |{'pack': 'int', 'charge': 'int'} | |




<a name="BEGIN"/>

#### BEGIN
| event Name | Description | Note |
| --- | --- | --- |
|stars_0 |int | |
|stars_1 |int | |
|stars_2 |int | |
|stars_3 |int | |
|stars_4 |int | |
|stars_5 |int | |
|stars_6 |int | |
|stars_7 |int | |
|stars_8 |int | |




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


