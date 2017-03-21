package de.ur.iw.navigame.data_download;

import de.ur.iw.navigame.utility.FileDownload;
import de.ur.iw.navigame.utility.FileStorage;
import de.ur.iw.navigame.utility.ServletRequestHandler;

import javax.json.*;
import javax.servlet.http.HttpServletResponse;
import java.io.ByteArrayInputStream;
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
        new FileDownload().Download("http://urwalking.ur.de:8080/routing/Router?xmlareas",
                s -> onAreasFileLoaded(s, response),
                v -> onDownloadError(response));
    }

    private void onAreasFileLoaded(String jsonContents, HttpServletResponse response) {
        FileStorage.storeFile(UNI_AREAS_FILE_NAME, jsonContents);
        readAndPrintAreasInfo(jsonContents, response);
    }

    private void readAndPrintAreasInfo(String jsonContents, HttpServletResponse response) {
        JsonObject fromFile = Json.createReader(new ByteArrayInputStream(jsonContents.getBytes())).readObject();
        JsonArray responseArray = Json.createArrayBuilder().build();
        responseArray = readAreasFromFile(fromFile, responseArray);

        try {
            PrintWriter responseWriter = response.getWriter();
            responseWriter.write(responseArray.toString());
            responseWriter.flush();
            responseWriter.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private JsonArray readAreasFromFile(JsonObject fromFile, JsonArray responseArray) {
        if (fromFile.containsKey("territories")) {
            JsonArray array = fromFile.getJsonArray("territories");

            for(int i = 0; i < array.size(); i++) {
                Set<String> keys = array.getJsonObject(i).keySet();

                for(String key : keys) {
                    if (key.equals("Uni Regensburg")) {
                        responseArray = buildAreasArray(array.getJsonObject(i).getJsonArray(key), i, key);
                    }
                }
            }
        }
        return responseArray;
    }

    private JsonArray buildAreasArray(JsonArray uniAreasArray, int i, String key) {
        JsonArrayBuilder values = Json.createArrayBuilder();

        for(int j = 0; j < uniAreasArray.size(); j++) {
            JsonObjectBuilder partObject = Json.createObjectBuilder();
            partObject.add("name", uniAreasArray.getJsonObject(j).getString("name"));
            partObject.add("filename", uniAreasArray.getJsonObject(j).getString("filename"));
            values.add(partObject);
        }

        return values.build();
    }

    private void onDownloadError(HttpServletResponse response) {

    }

    private boolean areasFileExists() {
        return false;
    }
}
