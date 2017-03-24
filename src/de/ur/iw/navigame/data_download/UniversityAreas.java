package de.ur.iw.navigame.data_download;

import de.ur.iw.navigame.utility.FileDownload;
import de.ur.iw.navigame.utility.FileStorage;
import de.ur.iw.navigame.utility.ServletRequestHandler;
import org.json.JSONArray;
import org.json.JSONObject;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;
import java.util.Set;

public class UniversityAreas implements ServletRequestHandler{

    private static final String UNI_AREAS_FILE_NAME = "uni_areas.json";

    @Override
    public void handleRequest(Map<String, String[]> params, HttpServletResponse response) {
        if (FileStorage.fileExists(UNI_AREAS_FILE_NAME) && !params.containsKey("force_fresh_download")) {
            FileStorage.loadFile(UNI_AREAS_FILE_NAME,
                    s -> readAndPrintAreasInfo(s, response),
                    v -> onDownloadError(response));
        } else {
            downloadAreasFile(response);
        }
    }

    private void downloadAreasFile(HttpServletResponse response) {
        new FileDownload().download("http://urwalking.ur.de:8080/routing/Router?xmlareas",
                s -> onAreasFileLoaded(s, response),
                v -> onDownloadError(response));
    }

    private void onAreasFileLoaded(String jsonContents, HttpServletResponse response) {
        FileStorage.storeFile(UNI_AREAS_FILE_NAME, jsonContents);
        readAndPrintAreasInfo(jsonContents, response);
    }

    private void readAndPrintAreasInfo(String jsonContents, HttpServletResponse response) {
        JSONObject fromFile = new JSONObject(jsonContents);
        JSONArray responseArray = readAreasFromFile(fromFile);

        try {
            PrintWriter responseWriter = response.getWriter();
            responseWriter.write(responseArray.toString());
            responseWriter.flush();
            responseWriter.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private JSONArray readAreasFromFile(JSONObject fromFile) {
        JSONArray responseArray = new JSONArray();

        if (fromFile.has("territories")) {
            JSONArray array = fromFile.getJSONArray("territories");

            for(int i = 0; i < array.length(); i++) {
                Set<String> keys = array.getJSONObject(i).keySet();

                for(String key : keys) {
                    if (key.equals("Uni Regensburg")) {
                        responseArray = buildAreasArray(array.getJSONObject(i).getJSONArray(key), i, key);
                    }
                }
            }
        }
        return responseArray;
    }

    private JSONArray buildAreasArray(JSONArray uniAreasArray, int i, String key) {
        JSONArray values = new JSONArray();

        for(int j = 0; j < uniAreasArray.length(); j++) {
            JSONObject partObject = new JSONObject();
            partObject.put("name", uniAreasArray.getJSONObject(j).getString("name"));
            partObject.put("filename", uniAreasArray.getJSONObject(j).getString("filename"));
            values.put(partObject);
        }

        return values;
    }

    private void onDownloadError(HttpServletResponse response) {
        System.out.println("On download error :(");
    }

}
