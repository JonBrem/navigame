package de.ur.iw.navigame.sessions;

import de.ur.iw.navigame.data_download.AreaLevels;
import de.ur.iw.navigame.data_download.UniversityAreas;
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
import java.util.function.Consumer;

public class SessionCreation implements ServletRequestHandler {

    @Override
    public void handleRequest(Map<String, String[]> params, HttpServletResponse response) {
        pickRandomPointsInMaps(objects -> {
            try {
                PrintWriter writer = response.getWriter();

                JSONObject obj = new JSONObject();
                obj.put("session_id", UUID.randomUUID().toString());

                obj.put("from_room", objects[0]);
                obj.put("to_room", objects[1]);

                writer.write(obj.toString());

                writer.flush();
                writer.close();

            } catch (IOException e) {
                try {
                    response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getLocalizedMessage());
                } catch (IOException e1) {
                    e.printStackTrace();
                }
            }
        },
        v -> {
            try {
                response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            } catch (IOException e1) {
                e1.printStackTrace();
            }
        });
    }

    private void pickRandomPointsInMaps(Consumer<JSONObject[]> onSuccess, Consumer<Void> onError) {
        new UniversityAreas().loadAreasFile((String s) -> onAreasFileLoaded(s, onSuccess, onError), onError);
    }

    private void onAreasFileLoaded(String jsonContents, Consumer<JSONObject[]> onSuccess, Consumer<Void> onError) {
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

    private void loadFirstRoom(JSONObject areaOne, JSONObject areaTwo, Consumer<JSONObject[]> onSuccess, Consumer<Void> onError) {
         new AreaLevels().loadAreaFile(areaOne.getString("filename"),
                s -> onFirstRoomFileLoaded(s, areaOne.getString("filename"), areaTwo, onSuccess, onError),
                onError);
    }

    private void onFirstRoomFileLoaded(String areaOneFile, String areaOneName, JSONObject areaTwo, Consumer<JSONObject[]> onSuccess, Consumer<Void> onError) {
        JSONObject areaFile = new JSONObject(areaOneFile);
        JSONObject roomId = getRandomRoomId(areaOneName, areaFile);

        new AreaLevels().loadAreaFile(areaTwo.getString("filename"),
                s -> onSecondRoomFileLoaded(roomId, s, areaTwo.getString("filename"), onSuccess),
                onError);

    }

    private void onSecondRoomFileLoaded(JSONObject roomOne, String areaTwoFile, String areaTwoName, Consumer<JSONObject[]> onSuccess) {
        JSONObject areaFile = new JSONObject(areaTwoFile);
        JSONObject roomTwo = getRandomRoomId(areaTwoName, areaFile);

        onSuccess.accept(new JSONObject[]{roomOne, roomTwo});
    }

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
