package de.ur.iw.navigame.data_download;

import de.ur.iw.navigame.utility.FileDownload;
import de.ur.iw.navigame.utility.FileStorage;
import de.ur.iw.navigame.utility.ServletRequestHandler;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.XML;

import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

public class AreaLevels implements ServletRequestHandler {

    @Override
    public void handleRequest(Map<String, String[]> params, HttpServletResponse response) {
        String whichArea = params.get("which_area")[0];

        if (FileStorage.fileExists("area_" + whichArea + ".json") && !params.containsKey("force_fresh_download")) {
            FileStorage.loadFile("area_" + whichArea + ".json",
                    s -> onAreaFileLoaded(whichArea, s, response, false),
                    v -> onDownloadError(response));
        } else {
            downloadAreaFile(whichArea, response);
        }
    }

    private void downloadAreaFile(String whichArea, HttpServletResponse response) {
        new FileDownload().download("http://urwalking.ur.de:8080/routing/Router?getxml=" + whichArea,
                s -> onAreaFileLoaded(whichArea, s, response, true),
                v -> onDownloadError(response));
    }

    private void onAreaFileLoaded(String whichArea, String jsonContents, HttpServletResponse response, boolean store) {
        if(store)
            FileStorage.storeFile("area_" + whichArea + ".json", jsonContents);

        String xmlPart = new JSONObject(jsonContents).getString("xml");
        JSONObject asObject = XML.toJSONObject(xmlPart);

        // ensure the data structure is always the same:
        JSONObject graph = asObject.getJSONObject("graph");
        Object levelContainer = graph.get("level");
        if (levelContainer instanceof JSONObject) {
            JSONArray levelArray = new JSONArray();
            levelArray.put(levelContainer);
            graph.put("level", levelArray);
        }

        downloadImagesUnlessLoaded(whichArea, asObject, response);
    }

    private void downloadImagesUnlessLoaded(String whichArea, JSONObject asObject, HttpServletResponse response) {
        recursiveImageDownload(whichArea, asObject, 0, response);
    }

    /**
     *
     * @param whichArea area index (PT, Mathematik etc.)
     * @param object the big JSON file containing all the levels and rooms.
     * @param currentIndex this is recursive, so this is just to keep track of which image files have been downloaded
     *                     and what is next. index is of the "level"-array.
     * @param response response that is being passed around to avoid conflicts with multiple simultaneous requests.
     */
    private void recursiveImageDownload(String whichArea, JSONObject object, int currentIndex,
                                        HttpServletResponse response) {
        JSONArray arr = object.getJSONObject("graph").getJSONArray("level");

        if (arr.length() <= currentIndex) {
            readAndPrintLevelInfo(object, response);
        } else {
            JSONObject levelObject = arr.getJSONObject(currentIndex);

            if (FileStorage.fileExists(levelObject.getString("mapfile"))) {
                checkSvg(levelObject);
                recursiveImageDownload(whichArea, object, currentIndex + 1, response);
            } else {
                new FileDownload().downloadImage("http://urwalking.ur.de:8080/routing/Router?getimage&xmlfile=" +
                        whichArea + "&levelid=" + levelObject.getInt("id"),
                        data -> storeImageFile(data, whichArea, object, currentIndex, response),
                        v -> onDownloadError(response));
            }
        }
    }

    private void storeImageFile(byte[] data, String whichArea, JSONObject object, int currentIndex,
                                HttpServletResponse response) {
        JSONObject levelObject = object.getJSONObject("graph").getJSONArray("level").getJSONObject(currentIndex);

        FileStorage.storeImageFile(levelObject.getString("mapfile"), data);

        if (checkSvg(levelObject)) {
            FileStorage.storeImageFile(levelObject.getString("mapfile"), data);
        }

        recursiveImageDownload(whichArea, object, currentIndex + 1, response);
    }

    private boolean checkSvg(JSONObject levelObject) {
        String s = FileStorage.loadFileNoCallback(levelObject.getString("mapfile"));
        if (s != null && s.startsWith("<?xml")) {
            levelObject.put("mapfile", levelObject.get("mapfile") + ".svg");
            return true;
        }

        return false;
    }

    private void readAndPrintLevelInfo(JSONObject areaData, HttpServletResponse response) {
        JSONArray levelArray = areaData.getJSONObject("graph").getJSONArray("level");
        JSONArray responseContents = new JSONArray();

        for(int i = 0; i < levelArray.length(); i++) {
           JSONObject levelObj = levelArray.getJSONObject(i);
           JSONObject forResponse = new JSONObject();

           forResponse.put("level_id", levelObj.getInt("id"));
           forResponse.put("image_path", levelObj.getString("mapfile"));
           forResponse.put("storey", levelObj.getInt("storey"));

           responseContents.put(forResponse);
        }

        try {
            PrintWriter responseWriter = response.getWriter();
            responseWriter.write(responseContents.toString());
            responseWriter.flush();
            responseWriter.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void onDownloadError(HttpServletResponse response) {

    }
}
