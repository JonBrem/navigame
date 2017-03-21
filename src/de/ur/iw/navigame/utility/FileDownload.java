package de.ur.iw.navigame.utility;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.util.function.Consumer;

public class FileDownload {

    public void Download(String webAddress, Consumer<String> onSuccess, Consumer<Void> onFail) {
        try {
            URLConnection connection = getUrlConnection(webAddress);
            BufferedReader br = getReader(connection);

            StringBuilder toReturn = readLines(br);
            onSuccess.accept(toReturn.toString());

        } catch (java.io.IOException e) {
            e.printStackTrace();
            onFail.accept(null);
        }
    }

    private StringBuilder readLines(BufferedReader br) throws IOException {
        StringBuilder toReturn = new StringBuilder();
        String line;
        while((line = br.readLine()) != null) {
            toReturn.append(line).append('\n');
        }
        return toReturn;
    }

    private BufferedReader getReader(URLConnection connection) throws IOException {
        InputStream is = connection.getInputStream();
        return new BufferedReader(new InputStreamReader((is)));
    }

    private URLConnection getUrlConnection(String webAddress) throws IOException {
        URL url = new URL(webAddress);
        URLConnection connection = url.openConnection();
        connection.setDoOutput(true);
        connection.setConnectTimeout(1500);
        connection.connect();
        return connection;
    }

}
