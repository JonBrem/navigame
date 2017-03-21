package de.ur.iw.navigame.utility;

import javax.imageio.ImageIO;
import java.awt.*;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.util.function.Consumer;

public class FileDownload {

    public void download(String webAddress, Consumer<String> onSuccess, Consumer<Void> onFail) {
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


    public void downloadImage(String webAddress, Consumer<byte[]> onSuccess, Consumer<Void> onFail) {
        try {
            URL url = new URL(webAddress);
            InputStream in = new BufferedInputStream(url.openStream());
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[1024];

            int n;
            while (( n = in.read(buf)) != -1)
            {
                out.write(buf, 0, n);
            }
            out.close();
            in.close();
            byte[] response = out.toByteArray();
            onSuccess.accept(response);
        } catch (IOException e) {
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
        br.close();
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
