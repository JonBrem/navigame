package de.ur.iw.navigame.data_download;

import de.ur.iw.navigame.utility.FileDownload;
import de.ur.iw.navigame.utility.FileStorage;
import de.ur.iw.navigame.utility.J7Consumer;
import de.ur.iw.navigame.utility.ServletRequestHandler;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.XML;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

/**
 * Request handler that is responsible for downloading &amp; showing the levels / storeys in a given area.
 */
public class AreaLevels implements ServletRequestHandler {

    /**
     * Will print a list of storeys (with ids, map files...) for a given area.
     *
     * @param params request parameters. need to contain a "which_area" key.
     * @param response response that will receive the output / feedback.
     */
    @Override
    public void handleRequest(Map<String, String[]> params, final HttpServletResponse response) {
        final String whichArea = params.get("which_area")[0];

        loadAreaFile(whichArea,
                new J7Consumer<String>() {
                    @Override
                    public void accept(String val) {
                        onAreaFileLoaded(whichArea, val, response);
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
     * If the file exists: reads it and calls onSuccess;
     * if it does not exist: downloads it, stores it and calls onSuccess
     *
     * @param whichArea which area to load the storeys for.
     * @param onSuccess callback for when everything went okay
     * @param onError callback for if there was an error
     */
    public void loadAreaFile(String whichArea, J7Consumer<String> onSuccess, J7Consumer<Void> onError) {
        if (FileStorage.fileExists("area_" + whichArea + ".json")) {
            FileStorage.loadFile("area_" + whichArea + ".json", onSuccess, onError);
        } else {
            downloadAreaFile(whichArea, onSuccess, onError);
        }
    }

    /**
     * Downloads the area file and calls onSuccess if it went OK.
     *
     * @param whichArea which area to load the storeys for.
     * @param onSuccess callback for when everything went okay
     * @param onError callback for if there was an error
     */
    private void downloadAreaFile(final String whichArea, final J7Consumer<String> onSuccess, J7Consumer<Void> onError) {
        new FileDownload().download("http://urwalking.ur.de:8080/routing/Router?getxml=" + whichArea,
                new J7Consumer<String>() {
                    @Override
                    public void accept(String val) {
                        FileStorage.storeFile("area_" + whichArea + ".json", val);
                        onSuccess.accept(val);
                    }
                }, onError);
    }

    /**
     * Loads the XML-Parts of the file into a JSON-Object and then passes them on to a method
     * that will check that all the images are on this server, then print the storey data to the client.
     *
     * @param whichArea which area to load the storeys for.
     * @param jsonContents json contents of an area file.
     * @param response response that will receive the output / feedback.
     */
    private void onAreaFileLoaded(String whichArea, String jsonContents, HttpServletResponse response) {
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

        recursiveImageDownload(whichArea, asObject, 0, response);
    }

    /**
     * Ensures that all images have been downloaded. This is called recursively because Thread iterations
     * are hard to do. When all images are present, the data can finally be output.
     *
     * @param whichArea area index (PT, Mathematik etc.)
     * @param object the big JSON file containing all the levels and rooms.
     * @param currentIndex this is recursive, so this is just to keep track of which image files have been downloaded
     *                     and what is next. index is of the "level"-array.
     * @param response response that is being passed around to avoid conflicts with multiple simultaneous requests.
     */
    private void recursiveImageDownload(final String whichArea, final JSONObject object, final int currentIndex,
                                        final HttpServletResponse response) {
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
                        new J7Consumer<byte[]>() { // on success
                            @Override
                            public void accept(byte[] data) {
                                storeImageFile(data, whichArea, object, currentIndex, response);
                            }
                        },
                        new J7Consumer<Void>() { // on error
                            @Override
                            public void accept(Void val) {
                                onDownloadError(response);
                            }
                        });
            }
        }
    }

    /**
     *
     * @param data Bytes of the image file
     * @param whichArea area index (PT, Mathematik etc.)
     * @param object the big JSON file containing all the levels and rooms.
     * @param currentIndex this is recursive, so this is just to keep track of which image files have been downloaded
     *          and what is next. index is of the "level"-array.
     * @param response response that will receive the output / feedback.
     */
    private void storeImageFile(byte[] data, String whichArea, JSONObject object, int currentIndex,
                                HttpServletResponse response) {
        JSONObject levelObject = object.getJSONObject("graph").getJSONArray("level").getJSONObject(currentIndex);

        FileStorage.storeImageFile(levelObject.getString("mapfile"), data);

        if (checkSvg(levelObject)) {
            FileStorage.storeImageFile(levelObject.getString("mapfile"), data);
        }

        recursiveImageDownload(whichArea, object, currentIndex + 1, response);
    }

    /**
     * Currently, all the map files are called .png, even though some are .svg files.
     * To cope with this - it causes problems!! - the files are read and, if they have an xml header,
     * a new version of the file is created with a .svg ending.
     *
     * @param levelObject JSON object for one level / storey
     * @return true, if the map file is an .svg file (even though it is probably called .png)
     */
    private boolean checkSvg(JSONObject levelObject) {
        String s = FileStorage.loadFileNoCallback(levelObject.getString("mapfile"));
        if (s != null && s.startsWith("<?xml")) {
            levelObject.put("mapfile", levelObject.get("mapfile") + ".svg");
            return true;
        }

        return false;
    }

    /**
     * Creates a JSON array containing objects with keys:
     * <pre>
     * {
     *   levelid: int,
     *   image_path: url,
     *   storey: int
     * }
     * </pre>
     *
     * and prints that object to the client as a JSON string.
     *
     * @param areaData the big JSON file containing all the levels and rooms.
     * @param response response that will receive the output / feedback.
     */
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
