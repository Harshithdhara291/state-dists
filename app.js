const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObjectState = (dbObjectState) => {
  return {
    stateId: dbObjectState.state_id,
    stateName: dbObjectState.state_name,
    population: dbObjectState.population,
  };
};

const convertDbObjectToResponseObjectDistrict = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

///API 1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state;`;
  const statesArray = await database.all(getStatesQuery);
  response.send(
    statesArray.map((each) => convertDbObjectToResponseObjectState(each))
  );
});

///API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT 
      * 
    FROM 
      state 
    WHERE 
      state_id = ${stateId};`;
  const state = await database.get(getStateQuery);
  response.send(convertDbObjectToResponseObjectState(state));
});

///API 3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDQ = `
  INSERT INTO
    district (district_name,state_id,cases,cured,active,deaths)
  VALUES
    ('${districtName}', ${stateId}, '${cases}', '${cured}', '${active}', '${deaths}');`;
  const districtArray = await database.run(postDQ);
  const districtId = districtArray.lastID;

  response.send("District Successfully Added");
});

///API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistQuery = `
    SELECT 
      * 
    FROM 
      district 
    WHERE 
      district_id = ${districtId};`;
  const dist = await database.get(getDistQuery);
  response.send(convertDbObjectToResponseObjectDistrict(dist));
});

///API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDQ = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId};`;
  await database.run(deleteDQ);
  response.send("District Removed");
});

///API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDQ = `
  UPDATE
    district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = '${cases}',
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
  WHERE
    district_id = ${districtId};`;

  await database.run(updateDQ);
  response.send("District Details Updated");
});

///API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getSSQuery = `
    SELECT 
      * 
    FROM 
      district 
    WHERE 
      district_id = ${districtId};`;
  const dist = await database.get(getSSQuery);
  response.send(convertDbObjectToResponseObjectDistrict(dist));
});

///API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistQuery = `
    SELECT 
      state.state_name
    FROM 
      district INNER JOIN state ON district.state_id = state.state_id
      WHERE   
      district.district_id = ${districtId} ;`;
  //
  const dist = await database.get(getDistQuery);
  response.send(convertDbObjectToResponseObjectDistrict(dist));
});

module.exports = app;
