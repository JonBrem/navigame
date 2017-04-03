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
import java.util.function.Consumer;

public class UniversityAreas implements ServletRequestHandler{

    private static final String UNI_AREAS_FILE_NAME = "uni_areas.json";

    @Override
    public void handleRequest(Map<String, String[]> params, HttpServletResponse response) {
        loadAreasFile(s -> readAndPrintAreasInfo(s, response),
                v -> onDownloadError(response));
    }

    public void loadAreasFile(Consumer<String> onSuccess, Consumer<Void> onError) {
        if (FileStorage.fileExists(UNI_AREAS_FILE_NAME)) {
            FileStorage.loadFile(UNI_AREAS_FILE_NAME, onSuccess, onError);
        } else {
            downloadAreasFile(onSuccess, onError);
        }
    }

    private void downloadAreasFile(Consumer<String> onSuccessfulDownload, Consumer<Void> onError) {
        new FileDownload().download("http://urwalking.ur.de:8080/routing/Router?xmlareas",
                s -> {
                    onAreasFileLoaded(s);
                    onSuccessfulDownload.accept(s);
                }, onError);
    }

    private void onAreasFileLoaded(String jsonContents) {
        FileStorage.storeFile(UNI_AREAS_FILE_NAME, jsonContents);
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

    public JSONArray readAreasFromFile(JSONObject fromFile) {
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
