package de.ur.iw.navigame.utility;

import java.io.*;
import java.net.URL;
import java.net.URLConnection;

/**
 * Enables downloading files to this server (has nothing to do with the client - Tomcat takes care of
 * client/server communication itself)
 */
public class FileDownload {

    /**
     * Downloads a file to a String. Uses UTF-8 encoding (see {@link FileDownload#download(String, J7Consumer, J7Consumer, String)}
     * if you want to specify another encoding);
     *
     * @param webAddress url of the file to download
     * @param onSuccess callback when the download is complete
     * @param onFail callback when there is an error
     */
    public void download(String webAddress, J7Consumer<String> onSuccess, J7Consumer<Void> onFail) {
        this.download(webAddress, onSuccess, onFail, "UTF-8");
    }

    /**
     * Downloads a file to a String.
     *
     * @param webAddress url of the file to download
     * @param onSuccess callback when the download is complete
     * @param onFail callback when there is an error
     * @param encoding Character encoding
     */
    public void download(String webAddress, J7Consumer<String> onSuccess, J7Consumer<Void> onFail, String encoding) {
        try {
            URLConnection connection = getUrlConnection(webAddress);
            BufferedReader br = getReader(connection, encoding);

            StringBuilder toReturn = readLines(br);
            onSuccess.accept(toReturn.toString());

        } catch (java.io.IOException e) {
            e.printStackTrace();
            onFail.accept(null);
        }
    }

    /**
     * Downloads an file to a byte-array. Strings don't work for this, so the {@link FileDownload#download(String, J7Consumer, J7Consumer)}-method
     * does not work (unless for .svg-files).
     *
     * @param webAddress url of the file to download
     * @param onSuccess callback when the download is complete
     * @param onFail callback when there is an error
     */
    public void downloadImage(String webAddress, J7Consumer<byte[]> onSuccess, J7Consumer<Void> onFail) {
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

    /**
     * Reads the lines in the BufferedReader into a StringBuilder, concatenated by '\n'.
     *
     * @param br Reader from which lines will be read.
     * @return a StringBuilder containing all the lines in the BufferedReader.
     */
    private StringBuilder readLines(BufferedReader br) throws IOException {
        StringBuilder toReturn = new StringBuilder();
        String line;
        while((line = br.readLine()) != null) {
            toReturn.append(line).append('\n');
        }
        br.close();
        return toReturn;
    }

    /**
     * Creates a BufferedReader for a URLConnection.
     * @param connection connection for which to create the reader.
     * @return reader for output from the URLConnection.
     */
    private BufferedReader getReader(URLConnection connection, String encoding) throws IOException {
        InputStream is = connection.getInputStream();
        return new BufferedReader(new InputStreamReader(is, encoding));
    }

    /**
     * Opens a URLConnection for a web address.
     *
     * @param webAddress URL String for which to open the address.
     * @return Open &amp; Connected URL Connection (unless an exception is raised).
     */
    private URLConnection getUrlConnection(String webAddress) throws IOException {
        URL url = new URL(webAddress);
        URLConnection connection = url.openConnection();

        connection.setDoOutput(true);
        connection.setConnectTimeout(1500);
        connection.connect();
        return connection;
    }

}
