package de.ur.iw.navigame.sessions;

import de.ur.iw.navigame.data_download.AreaLevels;
import de.ur.iw.navigame.data_download.UniversityAreas;
import de.ur.iw.navigame.utility.J7Consumer;
import de.ur.iw.navigame.utility.ServletRequestHandler;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.XML;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * The SessionCreation initiates a new session of the game by creating a unique ID
 * and selecting two rooms, one of which will be the start and the other one of which will be
 * the goal of the path.
 */
public class SessionCreation implements ServletRequestHandler {

    // code-wise, this isn't great - it's more like a long chain of methods, with no data being stored in instance
    // variables. This should be improved by creating more classes.

    /**
     * Creates a new session of the game.
     *
     * @param params HTTP params; are not used by this particular request handler.
     * @param response response that will receive the output / feedback.
     */
    @Override
    public void handleRequest(Map<String, String[]> params, final HttpServletResponse response) {
        pickRandomPointsInMaps(
                new J7Consumer<JSONObject[]>() { // on Success
                   @Override
                   public void accept(JSONObject[] val) {
                       try {
                           sendSessionInfoToClient(response, val);
                       } catch (IOException e) {
                           sendErrorToClient(response, e);
                       }

                   }
               },
                new J7Consumer<Void>() { // on Error
                    @Override
                    public void accept(Void val) {
                        sendErrorToClient(response, new IOException(""));
                    }
                });
    }

    /**
     * Sends an internal server error to the client.
     *
     * @param response response that will receive the output / feedback.
     * @param e exception that occurred
     */
    private void sendErrorToClient(HttpServletResponse response, IOException e) {
        try {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getLocalizedMessage());
        } catch (IOException e1) {
            e.printStackTrace();
        }
    }

    /**
     * Creates a unique ID and sends that + data for two rooms to the client, as JSON.
     *
     * @param response response that will receive the output / feedback.
     * @param objects two objects that contain the data for two rooms of the university
     */
    private void sendSessionInfoToClient(HttpServletResponse response, JSONObject[] objects) throws IOException {
        PrintWriter writer = response.getWriter();

        JSONObject obj = new JSONObject();
        obj.put("session_id", UUID.randomUUID().toString());

        obj.put("from_room", objects[0]);
        obj.put("to_room", objects[1]);

        writer.write(obj.toString());

        writer.flush();
        writer.close();
    }

    /**
     * Loads the xmlareas file of the urwalking server, and then initiates the rest of the process
     *  (which continues with onAreasFileLoaded)
     *
     * @param onSuccess success callback
     * @param onError error callback
     */
    private void pickRandomPointsInMaps(final J7Consumer<JSONObject[]> onSuccess, final J7Consumer<Void> onError) {
        new UniversityAreas().loadAreasFile(
                new J7Consumer<String>() {
                    @Override
                    public void accept(String val) {
                        onAreasFileLoaded(val, onSuccess, onError);
                    }
                }, onError);
    }

    /**
     * Called when the xmlareas file of the urwalking server was loaded successfully.
     * picks to random sub-areas and continues the rest of the process (loadFirstRoom)
     *
     * @param jsonContents contents of the xmlareas file
     * @param onSuccess success callback
     * @param onError error callback
     */
    private void onAreasFileLoaded(String jsonContents, J7Consumer<JSONObject[]> onSuccess, J7Consumer<Void> onError) {
        JSONObject areasFile = new JSONObject(jsonContents);
        JSONArray areasData = new UniversityAreas().readAreasFromFile(areasFile);

        List<String> forbiddenAreas = Arrays.asList("othcampus", "mensa", "othseybothstr", "Campusplan");

        JSONObject areaOne;
        while(true) {
            areaOne = areasData.getJSONObject((int) (Math.random() * areasData.length()));
            if (!forbiddenAreas.contains(areaOne.getString("filename")))
                break;
        }

        JSONObject areaTwo;
        while(true) {
            areaTwo = areasData.getJSONObject((int) (Math.random() * areasData.length()));
            if (!forbiddenAreas.contains(areaTwo.getString("filename")))
                break;
        }

        loadFirstRoom(areaOne, areaTwo, onSuccess, onError);
    }

    /**
     * loads the first area file (the long files containing a graph and a list of all the rooms in an area),
     * then calls onFirstRoomFileLoaded
     *
     * @param areaOne object containing info about one area ({..., filename: PT, ...}-type
     * @param areaTwo object containing info about one area ({..., filename: PT, ...}-type
     * @param onSuccess success callback
     * @param onError error callback
     */
    private void loadFirstRoom(final JSONObject areaOne, final JSONObject areaTwo, final J7Consumer<JSONObject[]> onSuccess, final J7Consumer<Void> onError) {
         new AreaLevels().loadAreaFile(areaOne.getString("filename"),
                 new J7Consumer<String>() {
                     @Override
                     public void accept(String val) {
                         onFirstRoomFileLoaded(val, areaOne.getString("filename"), areaTwo, onSuccess, onError);
                     }
                 },
                 onError);
    }

    /**
     * selects a random room from the first area file and then continues the process (onSecondRoomFileLoaded)
     *
     * @param areaOneFile the long files containing a graph and a list of all the rooms in an area
     * @param areaOneName name of the first area (e.g. "PT")
     * @param areaTwo object containing info about one area ({..., filename: PT, ...}-type
     * @param onSuccess success callback
     * @param onError error callback
     */
    private void onFirstRoomFileLoaded(String areaOneFile, String areaOneName, final JSONObject areaTwo, final J7Consumer<JSONObject[]> onSuccess, J7Consumer<Void> onError) {
        JSONObject areaFile = new JSONObject(areaOneFile);
        final JSONObject roomId = getRandomRoomId(areaOneName, areaFile);

        new AreaLevels().loadAreaFile(areaTwo.getString("filename"),
                new J7Consumer<String>() {
                    @Override
                    public void accept(String val) {
                        onSecondRoomFileLoaded(roomId, val, areaTwo.getString("filename"), onSuccess);
                    }
                },
                onError);

    }

    /**
     *
     * @param roomOne data about the "start" room, which has already been selected.
     * @param areaTwoFile the long files containing a graph and a list of all the rooms in an area
     * @param areaTwoName name of the second area (e.g. "PT")
     * @param onSuccess success callback
     */
    private void onSecondRoomFileLoaded(JSONObject roomOne, String areaTwoFile, String areaTwoName, J7Consumer<JSONObject[]> onSuccess) {
        JSONObject areaFile = new JSONObject(areaTwoFile);
        JSONObject roomTwo = getRandomRoomId(areaTwoName, areaFile);

        onSuccess.accept(new JSONObject[]{roomOne, roomTwo});
    }

    /**
     * Selects a random (valid) room from the file, builds a JSONObject containing its data and returns that.
     * <em>valid</em> means that the room has to have a roomid.
     *
     * @param areaName name of an area (e.g. "PT")
     * @param areaFile the long files containing a graph and a list of all the rooms in an area
     * @return a {roomid: string, area: string, level: int}-type JSON object
     */
    private JSONObject getRandomRoomId(String areaName, JSONObject areaFile) {
        String xml = areaFile.getString("xml");
        JSONObject graph = XML.toJSONObject(xml).getJSONObject("graph");

        JSONObject level;
        JSONObject node;

        while(true) {
            Object levelContainer = graph.get("level");
            if (levelContainer instanceof JSONObject) {
                level = (JSONObject) levelContainer;
            } else {
                level = (JSONObject) ((JSONArray) levelContainer).get((int) (((JSONArray) levelContainer).length() * Math.random()));
            }

            Object nodeContainer = level.get("node");
            if (nodeContainer instanceof JSONObject) {
                node = (JSONObject) nodeContainer;
            } else {
                node = (JSONObject) ((JSONArray) nodeContainer).get((int) (((JSONArray) nodeContainer).length() * Math.random()));
            }

            if (node.has("roomid"))
                break;
        }

        JSONObject roomData = new JSONObject();
        roomData.put("area", areaName);
        roomData.put("level", level.get("id"));
        roomData.put("roomid", node.get("roomid").toString());
        return roomData;
    }


}
