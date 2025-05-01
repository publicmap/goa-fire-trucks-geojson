# Source API

gpsmiles API documentation

- URL: `https://gpsmiles.live//webservice? token=getLiveData&user=admin&pass=admin&company=Abc&format=json`
Input Parameter :
○ username : name of user
○ password : password of user
○ Compa name : Company short name
○ format : Json / XML / CSV
● Method : Get Method
● API response :
○ If parameters are missing or give wrong parameter name(s).
■ Invalid parameter
○ If special characters are given in url.
■ Invalid parameter
○ if format parameter are not given
■ It will consider json format ○ If given user not valid
■ Incorrect username and password ○ If vehicle or user License Expired.
■ Licence Expired
○ If data not available for that vehicle.
■ No Vehicle Found
○ If vehicle number not matched with system vehicle number
■ No Vehicle Found ○ If user is inactive
■ User is inactive
● Sample data output on API call :
○ {"root":{"VehicleData" :[{"Company" : "ABCD","Branch" : "Mumbai","Vehicle_No" :
"XT123","Vehicle_Name" : "Truck","Vehicletype" : "Car","Driver_First_Name" : "--","Driver_Middle_Name" : "--","Driver_Last_Name" : "--","Imeino" : "000000000","DeviceModel" : "","Location" : "Mumbai India","POI" : "--","Datetime" : "05-10-2020 23:13:09","GPSActualTime" : "05-10-2020 23:13:08","Latitude" : "19.2751911","Longitude" : "72.9126444","Status" : "INACTIVE","Speed" : "7","GPS" : "ON","IGN" : "ON","Power" : "ON","Door1" : "--","Door2" : "--","Door3" : "--","Door4" : "--","AC" : "--","Temperature" : "--","Fuel" : "--","SOS" : "--","Distance" : "--","Odometer" : "0"}]}}
1. Parameter Description :
a. Company : Company Name
b. Branch : Branch Name
c. Vehicle_No : Vehicle Number
d. Vehicle_Name : Vehicle Name
e. VehicleType : Vehicle Type
API Document
f. Driver_First_Name : -- Driver first Name
g. Driver_Middle_Name : -- Driver Second Name
h. Driver_Last_Name : -- Driver Last Name
i. Imeino : IMEI number
j. DeviceModel : Gps device model
k. Location : Address of vehicle as per the local database
l. POI : -- POI information
m. Datetime : Server Date & time
n. GPSActualTime : Device data date & time
o. Latitude : Data Latitude
p. Longitude : Data Longitude
q. Status : Vehicle status
In our system you will have 4 status and its available as per configuration over the server
i. Running : If found Ignition On and Speed > Speed tolerance. If Ignition is not attached then condition will be Speed > Speed tolerance.
ii. Idle : If found Ignition On and Speed = 0. In case of ignition not attached then idle status will not be there.
iii. Stop : If found Ignition Off. If Ignition is not attached then condition will be Speed < Speed tolerance.
iv. Inactivate : If system not found data from last 60 minutes from device.Its configurable so you can change inactive time from company rule.
r. Speed : Speed as per data
s. GPS : Gps status
t. IGN : Ignition status
u. Power : Power status
v. Door1 : -- Door1 Status
w. Door2:--Door2Status
x. Door3 : -- Door3 Status
y. Door4 : -- Door4 Status
z. AC : -- Air condition Status. It will be available if the system has AC configuration
for the vehicle.
aa. Temperature : -- Temperature raw data
bb. Fuel : -- Fuel raw data
cc. SOS : -- SOS status
dd. Distance : -- Its not available as calculated data.
ee. Odometer : If found value in data string then same as found on this parameter.

Sample JSON API response:
```
{"root":{"VehicleData" :[{"Vehicle_Name":"4G","Company":"Directorate of Fire Emergency Services","Temperature":"--","Latitude":"15.5330917","GPS":"ON","Vehicle_No":"GA 07 G 0680-PIL(QUICK RESPONSE VEHICLE)","Door1":"--","Door4":"--","Branch":"Fire Station Pilerne","Vehicletype":"Truck","Door2":"--","Door3":"--","GPSActualTime":"01-05-2025 19:13:43","Datetime":"01-05-2025 19:13:48","Status":"STOP","DeviceModel":"L400","Speed":"0","AC":"--","Imeino":"864180052940132","Odometer":"7140","POI":"At Fire Station Pilerne","Driver_Middle_Name":"--","Longitude":"73.794035","Immobilize_State":"--","IGN":"OFF","Driver_First_Name":"--","Angle":"0","SOS":"--","Fuel":[],"battery_percentage":"0","ExternalVolt":"--","Driver_Last_Name":"--","Power":"ON","Altitude":"0","Location":"At Fire Station Pilerne"},{"Vehicle_Name":"TS101","Company":"Directorate of Fire Emergency Services","Temperature":"--","Latitude":"15.486662","GPS":"ON","Vehicle_No":"GA 07 G 0308-FFHQ(QUICK RESPONSE)","Door1":"--","Door4":"--","Branch":"Fire Force Headquarters","Vehicletype":"Truck","Door2":"--","Door3":"--","GPSActualTime":"01-05-2025 19:13:43","Datetime":"01-05-2025 19:13:46","Status":"STOP","DeviceModel":"TS101","Speed":"0","AC":"--","Imeino":"220717923","Odometer":"0","POI":"0.23 km from Fire Station panaji","Driver_Middle_Name":"--","Longitude":"73.817413","Immobilize_State":"--","IGN":"OFF","Driver_First_Name":"--","Angle":"226","SOS":"--","Fuel":[],"battery_percentage":"0","ExternalVolt":"12.14","Driver_Last_Name":"--","Power":"ON","Altitude":"0","Location":"Caculo Mall, 16 Shanta, St Inez Rd, Caculo Enclave, Santa Inez, Panaji, Goa (NW)"},{"Vehicle_Name":"TS101","Company":"Directorate of Fire Emergency Services","Temperature":"--","Latitude":"15.522945","GPS":"ON","Vehicle_No":"GA 07 G 5115-POR(MINI WATER TENDER)","Door1":"--","Door4":"--","Branch":"Fire Station Porvorim","Vehicletype":"Truck","Door2":"--","Door3":"--","GPSActualTime":"01-05-2025 19:14:57","Datetime":"01-05-2025 19:15:00","Status":"STOP","DeviceModel":"TS101","Speed":"0","AC":"--","Imeino":"220718761","Odometer":"0","POI":"At Porvorim Fire Station","Driver_Middle_Name":"--","Longitude":"73.829491","Immobilize_State":"--","IGN":"OFF","Driver_First_Name":"--","Angle":"289","SOS":"--","Fuel":[],"battery_percentage":"0","ExternalVolt":"12.88","Driver_Last_Name":"--","Power":"ON","Altitude":"0","Location":"At Porvorim Fire Station"}
...
```