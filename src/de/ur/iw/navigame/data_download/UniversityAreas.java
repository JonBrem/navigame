package de.ur.iw.navigame.data_download;

import de.ur.iw.navigame.utility.FileDownload;
import de.ur.iw.navigame.utility.FileStorage;
import de.ur.iw.navigame.utility.J7Consumer;
import de.ur.iw.navigame.utility.ServletRequestHandler;
import org.json.JSONArray;
import org.json.JSONObject;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Set;

/**
 * Request Handler that can print a list of possible areas for maps to the client.
 */
public class UniversityAreas implements ServletRequestHandler{

    private static final String UNI_AREAS_FILE_NAME = "uni_areas.json";

    /**
     * Prints a list of areas to the client, possibly after downloading said list first.
     *
     * @param params request parameters. are not used in this request handler.
     * @param response response that will receive the output / feedback.
     */
    @Override
    public void handleRequest(Map<String, String[]> params, final HttpServletResponse response) {
        loadAreasFile(new J7Consumer<String>() {
                          @Override
                          public void accept(String val) {
                              readAndPrintAreasInfo(val, response);
                          }
                      },
                new J7Consumer<Void>() {
                    @Override
                    public void accept(Void val) {
                        onDownloadError(response);
                    }
                });
    }

    /**
     * If the xmlareas file from the urwalking server already exists on this local server,
     * it just reads the contents of it;
     * otherwise, the file will be downloaded first.
     *
     * @param onSuccess success callback
     * @param onError error callback
     */
    public void loadAreasFile(J7Consumer<String> onSuccess, J7Consumer<Void> onError) {
        if (FileStorage.fileExists(UNI_AREAS_FILE_NAME)) {
            FileStorage.loadFile(UNI_AREAS_FILE_NAME, onSuccess, onError);
        } else {
            downloadAreasFile(onSuccess, onError);
        }
    }

    /**
     * Loads the xmlareas file from the urwalking server.
     *
     * @param onSuccessfulDownload success callback
     * @param onError error callback
     */
    private void downloadAreasFile(final J7Consumer<String> onSuccessfulDownload, J7Consumer<Void> onError) {
        new FileDownload().download("http://urwalking.ur.de:8080/routing/Router?xmlareas",
                new J7Consumer<String>() {
                    @Override
                    public void accept(String val) {
                        onAreasFileLoaded(val);
                        onSuccessfulDownload.accept(val);
                    }
                }, onError, "windows-1252");
    }

    /**
     * Saves a copy of the areas file.
     *
     * @param jsonContents the area file contents.
     */
    private void onAreasFileLoaded(String jsonContents) {
        FileStorage.storeFile(UNI_AREAS_FILE_NAME, jsonContents);
    }

    /**
     * Reads and prints the parts of the file that concern the university campus.
     *
     * @param jsonContents the area file contents.
     * @param response response that will receive the output / feedback.
     */
    private void readAndPrintAreasInfo(String jsonContents, HttpServletResponse response) {
        JSONObject fromFile = new JSONObject(jsonContents);
        JSONArray responseArray = readAreasFromFile(fromFile);

        try {
            PrintWriter responseWriter = response.getWriter();
            responseWriter.write(new String(responseArray.toString().getBytes("UTF-8")));
            responseWriter.flush();
            responseWriter.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * Reads data that concern the university campus and puts it in a json array, ignoring all other data
     * in the file.
     *
     * @param fromFile the data of the original areas file
     * @return JSONArray containing the areas of the university (ignoring all others)
     */
    public JSONArray readAreasFromFile(JSONObject fromFile) {
        JSONArray responseArray = new JSONArray();

        if (fromFile.has("territories")) {
            JSONArray array = fromFile.getJSONArray("territories");

            for(int i = 0; i < array.length(); i++) {
                Set<String> keys = array.getJSONObject(i).keySet();

                for(String key : keys) {
                    if (key.equals("Uni Regensburg")) {
                        responseArray = buildAreasArray(array.getJSONObject(i).getJSONArray(key));
                    }
                }
            }
        }
        return responseArray;
    }

    /**
     * Puts the data from the original xmlareas file in a more "focused" format for output.
     *
     * @param uniAreasArray original array in the xmlareas file.
     * @return a new array in a {name: x, filename: y} format.
     */
    private JSONArray buildAreasArray(JSONArray uniAreasArray) {
        JSONArray values = new JSONArray();

        for(int j = 0; j < uniAreasArray.length(); j++) {
            JSONObject partObject = new JSONObject();
            partObject.put("name", uniAreasArray.getJSONObject(j).getString("name"));
            partObject.put("filename", uniAreasArray.getJSONObject(j).getString("filename"));
            values.put(partObject);
        }

        return values;
    }

    /**
     * Sends an internal server error as a response.
     *
     * @param response response that will receive the output / feedback.
     */
    private void onDownloadError(HttpServletResponse response) {
        try {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "files could not be loaded from the URWalking-Server");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

}
