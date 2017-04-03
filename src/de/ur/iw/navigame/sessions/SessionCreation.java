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
        pickRandomPointsInMaps(strings -> {
            try {
                PrintWriter writer = response.getWriter();

                JSONObject obj = new JSONObject();
                obj.put("session_id", UUID.randomUUID().toString());

                obj.put("from_room", strings[0]);
                obj.put("to_room", strings[1]);

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

    private void pickRandomPointsInMaps(Consumer<String[]> onSuccess, Consumer<Void> onError) {
        new UniversityAreas().loadAreasFile((String s) -> onAreasFileLoaded(s, onSuccess, onError), onError);
    }

    private void onAreasFileLoaded(String jsonContents, Consumer<String[]> onSuccess, Consumer<Void> onError) {
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

    private void loadFirstRoom(JSONObject areaOne, JSONObject areaTwo, Consumer<String[]> onSuccess, Consumer<Void> onError) {
         new AreaLevels().loadAreaFile(areaOne.getString("filename"),
                s -> onFirstRoomFileLoaded(s, areaTwo, onSuccess, onError),
                onError);
    }

    private void onFirstRoomFileLoaded(String areaOneFile, JSONObject areaTwo, Consumer<String[]> onSuccess, Consumer<Void> onError) {
        JSONObject areaFile = new JSONObject(areaOneFile);
        String roomId = getRandomRoomId(areaFile);

        new AreaLevels().loadAreaFile(areaTwo.getString("filename"),
                s -> onSecondRoomFileLoaded(roomId, s, onSuccess),
                onError);

    }

    private void onSecondRoomFileLoaded(String roomOne, String areaTwoFile, Consumer<String[]> onSuccess) {
        JSONObject areaFile = new JSONObject(areaTwoFile);
        String roomTwo = getRandomRoomId(areaFile);

        onSuccess.accept(new String[]{roomOne, roomTwo});
    }

    private String getRandomRoomId(JSONObject areaFile) {
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

        return node.get("roomid").toString();
    }


}
