package de.ur.iw.navigame.utility;


import javax.servlet.http.HttpServletResponse;
import java.util.Map;

/**
 * Can write output to a {@link HttpServletResponse}, based on params provided to a {@link javax.servlet.http.HttpServletRequest}
 */
public interface ServletRequestHandler {

    void handleRequest(Map<String, String[]> params, HttpServletResponse response);

}
